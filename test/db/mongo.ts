import { expect } from 'chai';
import { config, defaultConfig } from '../../config/index';
import Server from '../../src/server';
import { except } from '../../src/utils/util';

describe.skip('test database store data', () => {
    let server = new Server(config,defaultConfig)
    let database = server.mgController

    async function query(filter: any) {
        return await database.query(filter)
    }

    // const testDatabase = config.mongoDBName
    const postColName = config.postsCollectionName
    before(async () => {
        await database.init()
        await database.drop(postColName)
    })

    after (async ()=> {
        await database.close()
    })

    let fakePostData = {
        title: 'posttitle',
        path: 'postpath',
        originDate: 'postOriginDate'
    }

    it('should store post data without any exception', async () => {
        try {
            let { status } = await database.saveDocuments([fakePostData])
            expect(status).eql('success')
        } catch (e) {
            //test failed
            throw e
        }
    })

    it('should query data without any exception', async () => {
        let result= await query({
            path: fakePostData.path
        })
        expect(result).not.eql({})
    })

    it('should update and add necessary id', async () => {
        let { status } = await database.update({
            path: 'postpath'
        }, {
                path: 'updatedPath'
        })

        expect(status).eql('success')
        let response = await query({
            path: 'updatedPath'
        })
        let updatedFakePostDate = except({ ...fakePostData },['_id'])
        updatedFakePostDate['path'] = 'updatedPath'
        expect(except(response[0],['_id'])).eqls(updatedFakePostDate)
    })

    it("result should is empty string because we query key which doesn't exists in collection",async () => {
        let response= await query({
            path:'IamNotExist'
        })

        expect(response).to.eql([])
    })

    it('should delete many documents without throws any exceptions', async () => {
        let { status } = await database.deleteDocuments({
            path: 'test'
        })
        expect(status).eqls('success')
    })
    it('should fetch top ten posts',async () => {
        let response = await database.query({

        },{
            skip:0,
            limit:10,
            sort:{
                originDate:-1
            }
        })
        expect(Array.isArray(response)).to.be.true

        expect(response.length).not.eql(0)
    })
})