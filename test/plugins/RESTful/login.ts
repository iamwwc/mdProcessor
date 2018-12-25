import { expect } from 'chai'
import createServer from '../../utils/freshServer'
import Axios, { AxiosInstance } from 'axios'

describe.skip('Login Test, it should works like charm', () => {


    let server
    let config
    let loginURL
    let api : AxiosInstance
    before(async () => {
        server = createServer()
        await server.init()
        await server.startListen()
        config = server.config
        api = Axios.create({
            proxy: false,
            baseURL: `http://${config.serverListenAddr}:${config.serverPort}/api/`
        })

        loginURL = `http://${config.serverListenAddr}:${config.serverPort}/api/login`
    })

    after(async () => {
        await server.exit()
    })

    it('should login successfully and then use token to fetch users info', async () => {
        let user = config.admins[0].name
        let password = config.admins[0].password
        let { data: { token } } = await api.get('login', {
            params: {
                username: user,
                password: password
            }
        })

        expect(token).be.exist

        //use generated token to login and fetch User

        // 这里有一个问题，出现了404
        let { data: { status } } = await api.patch('admin/post',{
            filter:{
                _id:'5c03eace5eb30d47247e71a8'
            },
            data:{
                excerpt:'iampatched'
            }
        },{
            headers:{
                auth: token
            }
        })
        expect(status).be.exist
        expect(status).be.eqls('success')

    })

    it('should login failed because of wrong username', async () => {
        let user = 'I_Am_Wrong_User_Name'
        let password = config.admins[0].password
        let { data: { token, status } } = await api.get('login', {
            params: {
                username: user,
                password: password
            }
        })

        expect(token).be.not.exist
        expect(status).be.exist
        expect(status).be.eqls('failed')
    })
})