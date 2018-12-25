import Server from '../../server'
import beforeReq from './beforeReq'
import query from './query'
import admin from './admin'
import login from './login'

export default function(this: Server){
    beforeReq(this)
    query.call(this)
    login(this)
    admin(this)
}