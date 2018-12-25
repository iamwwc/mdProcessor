import { verify } from 'jsonwebtoken';
import Server from '../../server';
import admin from './admin';


declare module "redis" {
    export interface RedisClient extends NodeJS.EventEmitter {
        getAsync(...args: any[]): Promise<any>
    }
}

export default function (server: Server) {
    let { config, router, redis: redisClient } = server

    let { serverAdminPath, jwtSecToken } = config

    router.all('*', async (ctx, next) => {
        let toAdmin = ctx.url.startsWith(serverAdminPath)
        if (!toAdmin) {
            return next()
        }

        let auth = ctx.header['auth']
        if (!auth) {
            return ctx.body = {
                status: 'failed',
                msg: 'need auth header'
            }
        }
        let res = verifyJwtToken(auth, jwtSecToken)
        if (res === false) {
            return ctx.body = {
                status: 'failed',
                msg: 'auth failed'
            }
        }

        let reply = await redisClient.getAsync('token')

        // if (res === reply) {
        //     return next()
        // }

        if(auth === reply){
            return next()
        }

        return ctx.body = {
            status: 'failed',
            msg: 'Auth failed when try check whether token is valid'
        }
    })

    // add admin operation router
    admin(server)
}

function verifyJwtToken(srcToken, secToken) {
    try {
        let res = verify(srcToken, secToken)
        return res
    } catch (e) {
        return false
    }

}
