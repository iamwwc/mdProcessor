import Axios from 'axios'
import server from '../../../src/server'
import { config, defaultConfig} from '../../../config'
import { expect, assert } from 'chai';


describe.skip('test http api fetch posts and tags', () => {
    const apiPath = `${config.serverListenAddr}:${config.serverPort}`

    const axios = Axios.create({
        headers: {
            'Content-Type': 'application/json'
        },
        proxy: false,
        baseURL: `http://${apiPath}`//不加http出错
    })
    var instance: server
    before(async () => {
        instance = new server(config, defaultConfig)
        await instance.init()
        await instance.startListen()
    })

    after(async () => {
        await instance.exit()
    })


    it('should fetch single post without any exception', async () => {
        let postName = 'Vue使用过程中遇到的问题'
        let { data: result } = await axios.get(`${config.serverApiPath}`, {
            params: {
                filter:{
                    path:`${encodeURIComponent(postName)}`
                }
            }
        })
        expect(Object.keys(result).length).not.eql(0)
        expect(Array.isArray(result)).is.true
        expect(result.length).equal(1)
        expect(result[0].title).be.eql(postName)
    })

    it('should miss query post because there not title called iamtestnotitle', async () => {
        let postName = 'iamtestnotitle'
        let { data: result } = await axios.get(`${config.serverApiPath}`, {
            params: {
                filter:{
                    path: `${encodeURIComponent(postName)}`
                }
            }
        })

        expect(Object.keys(result).length).equal(0)
    })

    it('should fetch single tags without any exception', async () => {
        let { data: result} = await axios.get(`${config.serverApiPath}`, {
            params: {
                filter:{
                    'matter.tags': ['Vue']
                }
            }
        })
        expect(Object.keys(result).length).not.equal(0)
        expect(Array.isArray(result))
        expect(result.length).gt(0)
    })

    it("should return '' because we query a tag which doesn't exist", async () => {
        let { data: result } = await axios.get(`${config.serverApiPath}`, {
            params: {
                filter:{
                    'matter.tags': ['neveNeverExists']
                }
            }
        })
        expect(Object.keys(result).length).equal(0)
    })

    it('customize query should works well without any exception', async () => {
        let { data: result } = await axios.get(`${config.serverApiPath}`, {
            params: {
                filter: {

                },
                options: {
                    sort: {
                        originDate: -1
                    }
                }
            }
        })

        assert(Array.isArray(result))

        let origin = [...result]
        result.sort((prev, next) => {
            let prevDate = new Date(prev.originDate).getTime()
            let nextDate = new Date(next.originDate).getTime()
            return nextDate - prevDate
        })
        expect(origin).eqls(result)
    })
})