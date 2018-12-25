import Server from "../src/server";
import { config, defaultConfig} from '../config'
import path from 'path'

const resolve = (...dirs) => path.resolve(...dirs)

describe.skip('should success load external plugins without any exception', () => {
    
    let server : Server
    before(async () => {
        server = new Server(config, defaultConfig)
        await server.init()
    })

    after(async () => {
        await server.exit()
    })

    it('can load single scripts and inject server object',function (done){
        this.timeout(99999)
        let scriptsFile = resolve(__dirname,'./testdata/external_scripts/external_plugins_test.js')
        server.loadPlugins(scriptsFile)
        done()
    })

    it ('can load all files in directory and inject server object',function(done){
        this.timeout(99999)
        let scriptsDir = resolve(__dirname,'./testdata/external_scripts')
        server.loadPlugins(scriptsDir)
        done()
    })
})