import { expect } from 'chai';
import config from '../../config/config';
import defaultConfig from '../../config/default';
import { Post } from '../../src/global';
import Processor from '../../src/plugins/processor/index';
import server from '../../src/server';

describe.skip('it should process markdown files very well', async () => {

    let instance = new server(config,defaultConfig)
    
    let process = new Processor(instance)

    before(async () => {
        await instance.init()
        await instance.mgController.drop(config.postsCollectionName)
    })
    after(async () =>{
        await instance.exit()
    })
    
    let posts: Array<Post> = []
    it('can read files without exception',async function(){
        this.timeout(99999)
        posts = await process.process()
        let a
    })

    let postColName = config.postsCollectionName

    it('should store posts into mongo database without any exception', async () =>{
        let {status} = await instance.mgController.saveDocuments(posts)
        expect(status).eql('success')
    })
})