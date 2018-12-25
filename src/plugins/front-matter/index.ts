import matter, {GrayMatterFile, GrayMatterOption} from 'gray-matter'

export default class {
    private options: GrayMatterOption<string,Object>
    constructor(options : GrayMatterOption<string,Object>){
        this.options = options
    }
    public process(content:string) :GrayMatterFile<string> {
        return matter(content,this.options)
    }
}