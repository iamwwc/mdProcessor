import http from 'http';
import Koa, { Context, Request } from 'koa'
import bodyparser from 'koa-bodyparser'
import { Config, Post } from '../../global';
import Server from '../../server';
import log from '../../utils/log';
import Git from './git';
import { HMACVerify } from './utils';
import crypto from 'crypto'

export default class GithubWebHook {
    private nativeHTTP !: http.Server
    private config!: Config
    private static DEFAULT_LISTEN_PORT: number = 8666
    private static DEFAULT_ENABLE: boolean = false
    private processFn !: Function
    private git!: Git
    private verifier!: HMACVerify
    private koa!: Koa
    private server!: Server

    constructor(server: Server) {
        process.nextTick(() => {
            let processor = server.get('processor')
            this.processFn = processor.process.bind(processor)
        })
        this.config = server.config
        if (this.config.githubWebHook.enable || GithubWebHook.DEFAULT_ENABLE) {
            this.koa = new Koa()
            this.server = server
            let hook = server.config.githubWebHook
            this.verifier = new HMACVerify(hook.secureToken)
            this.git = new Git(server, server.config.sourceDir, hook.repoBranchName, hook.url)
            let port: number = this.config.githubWebHook.port || GithubWebHook.DEFAULT_LISTEN_PORT
            if (this.config.githubWebHook.port) {
                port = this.config.githubWebHook.port
            }

            this.koa.use(bodyparser())
            this.nativeHTTP = http.createServer(this.koa.callback())
                .listen(port)
            this.koa.use(this.handleRequest.bind(this))

            process.nextTick(() => {
                this.git.init()
                this.updateProjectAndProcess()
            })
        }
    }

    private async handleRequest(ctx: Context) {
        let { request, response } = ctx
        
        let signature = request.headers['x-hub-signature']
        
        try{
            let computed = 'sha1=' + this.verifier.compute(request.rawBody)
            if (!this.isValidGithubRequest(request)
                || !signature
                || !request.body) {
                return
            }
            if(crypto.timingSafeEqual(Buffer.from(signature,'utf8'),Buffer.from(computed,'utf8'))){
                this.updateProjectAndProcess()
                return
            }
            log.debug(`Receive Request But not come from Github IP:port
            ${request.socket.remoteAddress}:${request.socket.remotePort}`)
        }finally{
            response.body = ''
        }
    }

    private async updateProjectAndProcess(){
        let res = await this.git.update()
        log.debug(`update from repo detail ${JSON.stringify(res)}`)
        let posts: Array<Post> = await this.processFn()
        log.debug(`process posts finished total ${posts.length}`)

        // rebuild db
        let {mgController, redis} = this.server
        await mgController.drop()
        let result = await mgController.saveDocuments(posts)
        if(result.status === 'failed'){
            log.error(result.detail)
            return
        }

        // flush redis
        redis.flushall()
    }

    private isValidGithubRequest(request: Request): boolean {
        let event = request.headers["x-github-event"]

        if (request.method !== 'POST'
            && event !== 'push'
            && event !== 'ping') {
            log.debug(`Invalid request method: ${request.method} event ${event}`)
            return false
        }
        return true
    }

    // private rebuildRedis(){
    //     let redis

    //     let db = this.server.mgController

    //     this.server.redis.flushdb()
    //     this.server.redis.keys('*',(err, keys) => {
    //         if(err){
    //             log.error(err)
    //             return
    //         }

    //         keys.forEach(key => {
    //             db.query()
    //         })
    //     })

    // }
}