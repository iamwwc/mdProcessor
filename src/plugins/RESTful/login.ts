import Server from '../../server'
import webtoken from 'jsonwebtoken'

export default function (server: Server) {
    let { mgController: ctr, config, redis, router } = server
    router.get('/api/login', async (ctx, next) => {
        let { username, password } = ctx.query

        let res = await ctr.fetchUser({
            name: username
        }, {
                limit: 1
            })
        if (res.length === 0) {
            return ctx.body = reportFailedAuth()
        }
        if (res[0].password !== password) {
            return reportFailedAuth()
        }
        // auth success, sign token and add generated token into redis cache

        let token = webtoken.sign({
            username: username,
            timestamp: (new Date()).valueOf()
        }, config.jwtSecToken, {
            expiresIn: config.expireTime
        })

        redis.set('token', token, 'EX', config.expireTime)
        return ctx.body = {
            token: token
        }
    })
}

function reportFailedAuth() {
    return {
        status: 'failed',
        msg: 'check your name or password'
    }
}