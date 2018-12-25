import {only, except} from '../../src/utils/util'
import {expect} from 'chai'

describe('test function which comes from src/utils package',() => {
    let fakeObj = {
        name:'iamname',
        title:'iamtitle',
        path:'iampath'
    }
    it("[only] function should works like 'only'", done => {
        
        let res = only(fakeObj,['name','path'])

        expect(res).to.be.eql({
            name:'iamname',
            path:'iampath'
        })
        done()
    })

    it("[only] function should repalce key use opts ", done => {
        let opts = {
            name:'replacedName',
            path:'replacedPath'
        }

        let res = only(fakeObj,['name','path'],opts)

        expect(res).to.be.eql({
            replacedName:'iamname',
            replacedPath:'iampath'
        })
        done()
    })

    it("[expect] should remove all objects in args", done => {
        let fakeData = {
            title:'testtitle',
            name: 'testname',
            age:20
        }

        let removed = ['name','age']
        let res = except(fakeData,removed)
        expect(res).eqls({
            title:'testtitle'
        })
        done()
    })
})