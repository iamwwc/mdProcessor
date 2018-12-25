import { promises as fs, Stats } from 'fs';
import { GrayMatterFile } from 'gray-matter';
import path from 'path';
import defaultConfig from '../../../config/default';
import { Config, Post } from '../../global';
import server, { events } from '../../server';
import log from '../../utils/log';
import { except, formatDate, isDir, readFilesAsync, InArray } from '../../utils/util';
import frontMatter from '../front-matter';
import marked from '../markdown';


const resolve = (...dir) => path.resolve(...dir)

declare module "../../server" {
    export default interface processor {
        process()
    }
}

const supportedDirName = [
    'posts',
    'about'
]


// custom event
// beforeSortPosts
export default class {
    private instance: server
    private markedProcessor = new marked()
    private config: Config
    private frontMatterProcessor = new frontMatter({
        excerpt: true,
        excerpt_separator: '<!--more-->'
    })
    constructor(instance: server) {
        this.instance = instance
        this.config = this.instance.config
        this.instance.register('processor', this)
        this.instance.on('afterPluginsLoaded', this.process)

        this.instance.process = async function (this: any) {
            this.emit(events.beforeProcessFiles)
            let processor = this.get('processor')
            let posts: Array<Post> = await processor.process()
            this.emit(events.afterProcessFiles)
            return posts
        }.bind(this.instance)
    }

    /**
     * 可以接受文件或者目录，对于文件会正常处理，但不会添加prefix
     * @param dst 
     */
    public async process(dst?: string): Promise<Array<Post>> {
        let source = dst || this.config.sourceDir

        this.config.sourceDir = source

        //read all files then process , store into database

        if (!isDir(source)) {
            log.warn(`${source} is not a directory`)
            return await this.readFileAndStat(source).then(async ([stats, raw]) => {
                let res = await this.processSingle({stats, raw}, '')
                return res === null ? [] : [res]
            })
        }

        let rootNames = await fs.readdir(source)
        let promises : Array<Promise<Array<Post>>> = []

        // 去除掉不以_开头的 文件夹 ，暂时忽略文件
        rootNames = rootNames.filter(n => n.startsWith('_'))
                                .map(f => resolve(source,f))
                                .filter(f => isDir(f))

        let p = rootNames.map(async name => {
            return await this.processDir(name,path.basename(name).slice(1))
        })

        promises = promises.concat(...p)

        let posts : Array<Array<Post>> = await Promise.all(promises)
        return Array.prototype.concat.apply([],posts)
        
        // posts process completed, it can be stored into database now..
    }

    public async processDir(fullDirname : string, prefix?: string) {
        let posts: Array<any> = []
        let pathPrefix: string
        if(typeof prefix === 'undefined'){
            pathPrefix = path.basename(fullDirname)
        }else{
            pathPrefix = prefix
        }

        // posts路径特殊处理
        // if (prefix === 'posts'){
        //     prefix = 'post'
        // }

        pathPrefix = `/${pathPrefix}/`

        let filesName = await readFilesAsync(fullDirname)
        
        let promises = filesName.map(async file => {
            if(path.extname(file) !== '.md'){
                return Promise.resolve()
            }
            let [stats, raw] = await this.readFileAndStat(resolve(fullDirname,file))
            let ok = this.processSingle({ stats, raw }, pathPrefix)
            posts.push(...ok === null ? [] : [ok])
        })

        await Promise.all(promises)
        await this.instance.push('beforeSortPosts', posts)
        this.sortArrayByDate(posts)
        return this.generatePrevNextPosts(posts)
    }

    private readFileAndStat(file: string){
        return Promise.all([fs.stat(file),fs.readFile(file,{
            encoding: 'utf8'
        })])
    }

    public async storeIntoDatabase() {
        let posts = await this.process()
        await this.instance.mgController.saveDocuments(posts)
    }


    public processSingle({ stats, raw }: { stats: Stats, raw: string }, prefix: string): Post | null {
        if(typeof prefix === 'undefined'){
            prefix = ''
        }
        try {
            var res = this.frontMatterProcessor.process(raw)
            var html = this.markedProcessor.process(res.content)
        } catch (e) {
            log.error(`Error when process source file, file will be ignored -> ${e}`)
            return null
        }

        let frontMatter = res.data as any

        let originDate = formatDate(frontMatter.date 
                        || frontMatter.originDate 
                        || stats.birthtime.toLocaleDateString('zh-CN'));
        
        let updatedDate = formatDate(frontMatter.updatedDate
                        || stats.mtime.toLocaleDateString('zh-CN'))

        let post = {
            originDate: originDate,
            updatedDate: updatedDate,
            fullContent: html,
            excerpt: this.markedProcessor.process(res.excerpt),
            raw: raw,// has been removed front-matter
            rawContent: res.content
        } as Post

        let front: any = except(res.data, ['title'])

        let title = (res.data as any).title || res.content.slice(0, 10)

        let defaultAllow = defaultConfig.post.allowComments
        let allowComments = typeof front['allowComments'] === 'undefined' ?
            defaultAllow : frontMatter['allowComments']

        // post添加了tags，却没有添加明确的tag
        /**
         * tags:[
         * ]
         */
        if (front.tags === null) {
            front.tags = []
        }

        // 这样前端查询about等页面必须自己添加 /about/ 因为路由默认只有/about
        Object.assign(post, {
            matter: front,
            title: title,
            path: `${prefix}${title}`,
            allowComments: allowComments,
        })
        log.info(`generate Post ${post.title}`)
        return post
    }

    private sortArrayByDate(posts: Array<any>) {
        posts.sort((prev, next) => {
            let prevDate = new Date(prev.originDate).getTime()
            let nextDate = new Date(next.originDate).getTime()
            return nextDate - prevDate
        })
    }

    private generatePrevNextPosts(posts: Array<Post>): Array<Post> {
        if(posts.length === 0){
            return []
        }
        posts = posts.map((post, i) => {
            if (i) {
                post.prevPost = {
                    title: posts[i - 1].title,
                    path: posts[i - 1].path
                }
            }
            if (i < posts.length - 1) {
                post.nextPost = {
                    title: posts[i + 1].title,
                    path: posts[i + 1].path
                }
            }
            return post
        })
        posts[0].prevPost = null
        posts[posts.length - 1].nextPost = null
        return posts
    }

    private generatePost({ post, res }: { post: Post, res: GrayMatterFile<string> }) {
        
    }

    private async getNamesInDir(path: string) {
        return await readFilesAsync(path)
    }

    private needsHooks() {
        return []
    }
}
