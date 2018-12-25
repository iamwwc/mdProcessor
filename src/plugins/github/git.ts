import { default as gitFn, SimpleGit} from 'simple-git/promise'
import { isDir } from '../../utils/util';
import Server from '../../server';
import { Startable } from '../../global';

export default class Git implements Startable<void>{
    private workingDir: string
    
    private git!: SimpleGit
    private repoName: string
    private url: string

    private server: Server

    constructor(s: Server, workingDir: string, repoBranchName: string, repoUrl: string) {
        if(!isDir(workingDir)){
            throw new Error(`${workingDir} is not a valid directory`)
        }
        this.server = s
        this.workingDir = workingDir
        this.repoName = repoBranchName
        this.url = repoUrl
    }

    public async init(){
        this.git = await gitFn(this.workingDir)
        let isRepo = await this.git.checkIsRepo()
        if(!isRepo){
            this.initRepo()
        }
    }
    public async update(){
        return await this.git.pull(this.repoName,'master')
    }

    private async initRepo(){
        await this.git.init()
        return await this.git.addRemote(this.repoName,this.url)
    }
}