import {defaultConfig, config} from '../../config/index'
import Server from '../../src/server';
import log from '../../src/utils/log'

describe("when set level to info, shouldn't output debug log",() =>{

    before(() => {
    })
    
    it("dont't output debug log",done => {
        config.logLevel = 'info'
        new Server(config,defaultConfig)
        log.debug("Don't send to stdout")
        log.info("Show on stdout")
        done()
    })

} )