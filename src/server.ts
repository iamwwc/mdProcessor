import Bluebird from 'bluebird';
import EventEmitter from 'events';
import { promises as fs } from 'fs';
import http from 'http';
import Koa from 'koa';
import bodyparser from 'koa-bodyparser';
import Router from 'koa-router';
import Module from 'module';
import { default as nodePath, default as path } from 'path';
import redis, { RedisClient } from 'redis';
import vm from 'vm';
import config from '../config/config';
import { config as c, defaultConfig as dc } from '../config/index';
import MongoController from './db/mongo';
import { Config, DefaultConfig, Startable } from './global';
import log from './utils/log';
import { isClass, isDir, readFileAsync } from './utils/util';

Bluebird.promisifyAll(redis)

declare module "redis" {
    export interface RedisClient extends NodeJS.EventEmitter {
        getAsync(...args: any[]): Promise<any>
    }
}


const join = (...p) => path.join(...p)

class extend extends EventEmitter {
    protected extended: {} = new Object()
    constructor() {
        super()
    }
    public get(name) {
        return this.extended[name]
    }

    public register(name, fn) {
        this.extended[name] = fn
    }
}

export const events = [
    'beforeLoadInternalPlugins',
    'afterLoadInternalPlugins',
    'beforeLoadPlugins',
    'afterLoadPlugins',
    'beforeProcessFiles',
    'afterProcessFiles'
].reduce((prev, curr) => {
    prev[curr] = curr
    return prev
}, {}) as any

export default class Server extends extend implements Startable<void> {
    public koaApp = new Koa()
    public router = new Router()
    public sourceDir: string
    public mgController: MongoController
    public config!: Config
    public defaultConfig: DefaultConfig
    public redis: RedisClient

    private nativeHTTP: http.Server = http.createServer(this.koaApp.callback())
    constructor(config: Config, defaultConfig: DefaultConfig) {
        super()

        config ? this.config = config : this.config = c
        defaultConfig ? this.defaultConfig = defaultConfig : this.defaultConfig = dc

        this.sourceDir = this.config.sourceDir
        this.mgController = new MongoController(this)
        log.level = this.config.logLevel

        this.redis = redis.createClient({
            host: this.config.redisHost,
            port: this.config.redisPort
        })

        this.redis.on('error', () => {
            log.error('Redis Error')
            process.exit(-1)
        })

        this.redis.on('connect', () => {
            log.info('Redis Connected!')
        }) 
    }
    public async init(): Promise<void> {
        try{
            await this.mgController.init()
            this.koaApp
                .use(bodyparser())//顺序很重要
                .use(this.router.routes())
    
    
            this.emit(events.beforeLoadPlugins)
            await this.loadPlugins(this.config.pluginsDir)
            this.emit(events.afterLoadPlugins)
    
            this.emit(events.beforeLoadInternalPlugins)
            await this.loadInternalPlugins()
            this.emit(events.afterLoadInternalPlugins)
        }catch(e){
            log.error(e)
            log.error('Did you use right configuration? ')
            process.exit(-1)
        }
       
    }

    public async exit() {
        this.redis.quit()
        await Promise.all([this.mgController.close(),
                            this.closeHTTP()])
    }
    private closeHTTP(): Promise<any> {

        // 这样写http并不会关闭
        //return bluebird.promisify(this.nativeHTTP.close) as any

        return new Promise(resolve => {
            this.nativeHTTP.close(() => {
                log.info('server closed')
                resolve()
            })
        })
    }

    //插件在进行自身处理之前，通过push来将自己想要共享的数据发放注册了相应事件的回调当中
    // 返回 Promise来确保在所有插件初始化之后的下个事件循环周期调用(希望理解是对的)
    public push(event, receivedData: any): Promise<{}> {
        return new Promise((resolve, reject) => {
            process.nextTick(() => {
                this.emit(event, receivedData)
                resolve()
            })
        })
    }

    // 默认不会启动http server
    //必须调用此函数来启动
    public async startListen() {
        return new Promise((resolve, reject) => {
            this.nativeHTTP.listen(config.serverPort, () => {
                log.info(`Server listening on ${config.serverPort}`)
                resolve()
            })
        })
    }

    private async loadInternalPlugins() {
        const fns = await import('./plugins/index');
        let promises = Object.keys(fns).map(async fn => {
            let f = fns[fn]
            return await isClass(f) ? (new f(this)) : f.call(this)
        });

        return Promise.all(promises)
    }

    /**
     * 会在init过程中载入internal plugins之前被调用，也可以在后面再次调用来load其余的插件
     * @param path 插件目录或者脚本绝对路径， undefined 则会忽略插件加载
     * 外部插件将会在internal plugins之前加载
     * 可以在server初始化时将pluginsDir设置为undefined
     * 然后显式调用这个函数来在internalPlugins加载完成之后执行
     */
    public async loadPlugins(path: string | undefined) {
        if (typeof path === 'undefined') {
            return
        }
        try {
            if (isDir(path)) {
                let files = await fs.readdir(path)
                files.forEach(file => {
                    this.doLoadPlugin(join(path, file))
                })
                return
            }
            this.doLoadPlugin(path)
        } catch (e) {
            log.error(e)
        }
    }

    private async doLoadPlugin(path: string) {
        const self = this
        let script = await readFileAsync(path);
        const module = new Module(path);
        module.filename = path;
        let require: Function = Module.createRequireFromPath(path);
        script = `(function(exports, require, module, __filename, __dirname, server){${script}});`;
        const fn = vm.runInThisContext(script, path);
        return fn(module.exports, require, module, path, nodePath.dirname(path), self);
    }
}
