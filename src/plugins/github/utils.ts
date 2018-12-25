import crypto, { Hmac } from 'crypto'

export  class HMACVerify{
    private key : string
    constructor(key: string){
        this.key = key
    }

    public compute(body: any) : string{
        let er: Hmac = crypto.createHmac('sha1',this.key,{
            encoding: 'utf8'
        })
        if(!body){
            throw new Error('payload is falsey')
        }
        return er.update(body).digest('hex')
    }
}
