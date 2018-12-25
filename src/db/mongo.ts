import { Collection, Db, MongoClient } from 'mongodb';
import { Config, Result, Startable, UserInfo } from '../global';
import Server from '../server';
import log from '../utils/log';
import { only } from '../utils/util';

export default class MongoDb implements Startable<MongoClient>{
    private uri: string
    private client!: MongoClient
    private db!: Db
    private server: Server
    private config: Config
    private colName: string

    public collection!: Collection
    constructor(server: Server) {
        this.server = server
        this.config = server.config
        this.uri = `mongodb://${this.config.mongoDBHost}:${this.config.mongoDBPort}`
        this.client = new MongoClient(this.uri, {
            useNewUrlParser: true,
            connectTimeoutMS: 30000,
            socketTimeoutMS: 30000
        })
        this.colName = this.config.postsCollectionName
    }
    public async init(): Promise<MongoClient> {
        await this.client.connect()
        this.db = this.client.db(this.config.mongoDBName)
        this.collection = this.db.collection(this.colName)
        await this.addAdminUser()
        return this.client
    }

    public async addAdminUser(): Promise<void> {
        let { mongoDBUserCol, admins } = this.server.config
        let userCol = this.db.collection(mongoDBUserCol)

        let promises: Promise<any>[]
        promises = admins.map(async user => {
            let res = await userCol.updateOne({
                name: user.name
            }, {
                    $set: user
            }, { upsert: true })
            if (res.result.ok !== 1) {
                log.error(`ok !== 1, add admins any failed`)
            }

        })
        await Promise.all(promises)
    }

    public async close(): Promise<void> {
        await this.client.close()
    }

    /**
     * caller must ensure document exists in colName collection
     * if query miss, update will not insert new docs
     * @param colName collection name where to insert
     * @param query filter cmd, from mongdb 
     * @param d data want to insert into collection
     */
    public async update(query: any, d: any) {
        if (d instanceof Array) {
            return {
                status: 'failed',
                detail: 'only support *a* object, not allow array'
            } as Result
        }
        let result
        try {
            result = await this.collection.updateOne(query, {
                $set: d
            })
            if (result.result.ok) {
                return {
                    status: 'success'
                } as Result
            }
        } catch (e) {
            log.error(e)
        }
        return this.reportError(`error when update ${JSON.stringify(only(result, ['result', 'matchedCount', 'modifiedCount']))}`)
    }

    /**
     * 如果query miss， 那么result为null，caller必须进行检测
     * 
     * @param colName collection name
     * @param filter
     */
    public async query(filter: {}, options?: Object): Promise<Array<any>> {
        try {
            let result = await this.collection.find(filter, options).toArray() as any
            log.debug(`query finish: result length-> ${result.length}`)
            return result
        } catch (e) {
            log.error(`error when query -> ${e}`)
        }
        return []
    }

    public async fetchUser(filter: {}, options?: Object): Promise<Array<UserInfo>> {
        try {
            let userCol = this.db.collection(this.server.config.mongoDBUserCol)
            let result = await userCol.find(filter, options).toArray()
            return result
        } catch (e) {
            log.error(`error when fetch user ${e}`)
        }
        return []
    }

    /**
     * saveDocument
     */
    public async saveDocuments(toSave: any | Array<Object>) {
        let docs: Array<Object> = []
        if (!(toSave instanceof Array)) {
            docs.push(toSave)
        } else {
            docs = toSave
        }
        try {
            let writeResult = await this.collection.insertMany(docs, {
            })

            //from docs, ok is 1 if excuted correctly
            if (writeResult.result.ok !== 1) {
                let necessaryData = only(writeResult, ['insertedCount', 'insertedIds', 'result'])
                let toReport = JSON.stringify(necessaryData)
                log.error(`unknown error occurred -> ${toReport}`)
                return {
                    status: 'failed',
                    detail: 'unknown,see logs'
                } as Result
            }
            return {
                status: 'success'
            } as Result
        } catch (e) {
            log.error(e)
        }
        return this.reportError('failed when save documents')
    }

    /**
     * drop collection
     * @param colName name of collection to drop
     * @returns true when successfully drops a collection
     * ; false when collection to drop not exist
     */
    public async drop(colName?: string) {
        let currCol = typeof colName === 'undefined' ? this.colName : colName
        if (!this.isExists(currCol)) {
            return
        }
        let col = this.db.collection(currCol)
        return await col.drop().catch(e => {
            log.warn(`drop collection ${colName} failed, maybe it not exists`)
        })
    }

    public isExists(colName: string): boolean {
        return this.db.listCollections({
            name: colName
        }) ? true : false
    }

    public async deleteDocuments(filter: any) {
        try {
            let result = await this.collection.deleteOne(filter)
            if (result.result.ok === 1) {
                return {
                    status: 'success'
                } as Result
            }
            return this.reportError(`result is not ok, delete counts ${result.deletedCount}`)
        } catch (e) {
            log.error(e)
            return this.reportError('error when delete documents')
        }
    }

    private reportError(e: string): Result {
        return {
            status: 'failed',
            detail: e
        } as Result
    }
}