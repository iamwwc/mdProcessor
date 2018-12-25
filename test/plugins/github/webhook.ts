import { expect } from 'chai'
import Server from '../../../src/server';
import { config, defaultConfig } from '../../../config/index'

describe('Github webhook and git test', () => {
    let server: Server = new Server(config,defaultConfig)
    
    before(async () => {
        
    })

    it('should receive post request',async () => {
        await server.init()
        let a
    })
})