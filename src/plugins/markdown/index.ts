import utils from 'wwc-blog-utils'

const marked = utils.marked

let options = {
    gfm: true,
    pedantic: false,
    sanitize: false,
    tables: true,
    breaks: true,
    smartLists: true,
    smartypants: true,
    modifyAnchors: '',
    autolink: true
}
export default class {
    public process(content: string | undefined): string {
        if(content){
            return marked(content,options)
        }
        return ''
    }
}