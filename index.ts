import { config, defaultConfig } from './config/index'

import server from './src/server'

;(async function(){
    let s = new server(config,defaultConfig)
    await s.init()
    await s.startListen()
}());