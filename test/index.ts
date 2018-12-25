import server from '../src/server'
import config from '../config/config'
import defaultConfig from '../config/default'

describe.skip('test',() => {
    let s : server
    before(async () => {
        s = new server(config,defaultConfig)
        return await s.init()
    })

    after(async () => {
        return await s.exit()
    })
})