
// 连接数据库返回Promise，通过Promise.all来确保全部的服务都已经启动
export interface Waitable {
    start(): Promise<void>
}

//查询返回接口
export interface Returnable {
    $status: string
    $detail?: string
    $result: Object
}

export interface Startable<T> {
    init(): Promise<T>
}

export enum PostOperator {
    update,
    remove,
    add,
}


interface SimplePost {
    title: string
    path: string
}

export interface Post {
    title: string
    path: string

    matter: any

    allowComments: boolean,

    excerpt: string,
    fullContent: string,
    raw: string,
    rawContent:string,


    originDate, updatedDate: string,

    prevPost, nextPost: SimplePost | null
}

export interface Result {
    status: string,
    detail?: string,
    result?: Array<Object>
}

export interface Config {
    serverPort: number,
    serverListenAddr: string,
    serverApiPath: string,

    serverAdminPath: string,

    usedDatabase: string,

    mongoDBHost: string,
    mongoDBPort: number,
    mongoDBName: string,
    mongoDBUserCol: string

    admins: Array<{
        name: string,
        password: string
    }>



    postsCollectionName: string,
    logLevel: string,

    sourceDir: string,
    pluginsDir?: string,

    redisPort: number,
    redisHost: string,
    expireTime: number, //seconds

    jwtSecToken: string,

    githubWebHook:{
        enable: boolean,
        port: number,
        repoBranchName: string,
        url: string, // github repo url for example https://github.com/iamwwc/there.git
        secureToken: string
    }
}

export interface DefaultConfig {
    post: {
        allowComments: boolean
    }
}

export interface UserInfo {
    name: string,
    password: string,
    showName: string
}