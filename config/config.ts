import path from 'path'
import { Config } from '../src/global';
const resolve = (...dir: string[]) => path.resolve(...dir)

const isDev = process.env.mode === 'test'
const isWindows = process.platform === 'win32'

let config : Config ={
    serverPort: isDev ? 20000 : 5000,
    serverListenAddr: '127.0.0.1',
    serverApiPath: '/api/blog',

    serverAdminPath: '/api/admin/',

    usedDatabase: 'mongo',

    githubWebHook:{
        enable: true,
        port:5001,
        repoBranchName:'origin',
        url:'https://github.com/iamwwc/wwcblog.git',
        secureToken:'github_secToken'
    },

    mongoDBHost: "127.0.0.1",
    mongoDBPort: 27017,
    mongoDBName: 'blog',
    mongoDBUserCol: 'user',

    admins:[
        {
            name:'testuser',
            password:'testpassword'
        }
    ],

    redisPort: 6379,
    redisHost: '127.0.0.1',
    expireTime: 3000,

    jwtSecToken: isDev ? 'test' : 'secToken',

    postsCollectionName: isDev ? 'testposts' : 'posts',

    logLevel: 'debug',
    // pluginsDir: resolve(__dirname, '../test/testdata/external_scripts'),


    // sourceDir: resolve(__dirname, '../test/testdata/sourcemds/'),
    sourceDir:"D:\\Blogs\\Blogs\\source\\"
} 

export default config