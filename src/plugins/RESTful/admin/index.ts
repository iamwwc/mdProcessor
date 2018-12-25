import Server from '../../../server'
import Router from 'koa-router'

export default function (server: Server) {
    let { koaApp, config } = server
    let router = new Router({
        prefix: config.serverAdminPath,
        sensitive: true
    })
    deletePostById(router, server)
    updatePostById(router, server)

    koaApp.use(router.routes())
}

function deletePostById(router: Router, { mgController: ctr }: Server) {
    router.delete('post', async (ctx, next) => {
        let { filter } = ctx.query
        let res = await ctr.deleteDocuments(filter)
        return ctx.body = JSON.stringify(res)
    })
}

function updatePostById(router: Router, { mgController: ctr }: Server) {
    router.patch('post', async (ctx, next) => {
        let body = ctx.request.body
        if(!body){
            return ctx.body = {
                status: 'failed',
                msg: 'invalid http body'
            }
        }
        let { filter, data } = body as any
        let res = await ctr.update(filter, data)
        return ctx.body = JSON.stringify(res)
    })
}


function reportFailedAuth() {
    return {
        status: 'failed',
        msg: 'check your name or password'
    }
}