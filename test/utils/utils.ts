import {expect} from 'chai'

export function setFailed(msg : string){
    expect(() => {}).to.throw(msg)
}