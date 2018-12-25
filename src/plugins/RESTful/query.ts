import Router from 'koa-router'
import server from '../../server';
import log from '../../utils/log'

//for exported function, *this* will bind to server instance
//if you want to use *this* as normal, export a class instead
export default function (this: server) {
    customizeQuery(this.router, this)
}

async function customizeQuery(router: Router, app: server) {
    router.get(app.config.serverApiPath, async (ctx, next) => {
        let query = ctx.query

        // 在这里用query做为redis的key来缓存全部的查询数据
        // 事实上old post没几个人看，需要缓存的也就几个

        let res: string = ''
        let stringifyQuery = JSON.stringify(query)
        try {
            if (app.redis.exists(stringifyQuery)) {
                log.debug(`Redis cache hit key ${query}`)
                res = await app.redis.getAsync(stringifyQuery)
                return
            }
            let { filter, options } = query
            filter = JSON.parse(decodeURIComponent(filter ? filter : '{}'))
            options = JSON.parse(decodeURIComponent(options ? options : '{}'))
            log.debug(`Receive customize query -> filter: ${JSON.stringify(filter)} -> options: ${JSON.stringify(options)}`)
            let result = await app.mgController.query(filter, options)
            res = JSON.stringify(result)
            app.redis.set(stringifyQuery,res)
            return

        } catch (e) {
            res = JSON.stringify({
                status: 'failed',
                detail: 'failed when query'
        })
        } finally {
            return ctx.body = res
        }
    })
}
