import fs from 'fs'

export function isDir(path: string) {
    if (!fs.existsSync(path)) {
        throw new Error(`Path not exists in ${path}`)
    }

    if (fs.lstatSync(path).isDirectory()) {
        return true
    }
    return false
}

export async function readFilesAsync(path: string): Promise<Array<string>> {
    return import('fs')
        .then(({ default: { promises } }) => {
            return promises.readdir(path, {
                encoding: 'utf8'
            })
        })
}

export function InArray(src: any, dst: Array<any>): boolean {
    if (dst.indexOf(src, 0) === -1) return false
    return true
}

export async function readFileAsync(path: string) {
    return import('fs')
        .then(({ default: { promises } }) => {
            return promises.readFile(path, {
                encoding: "utf8"
            })
        })
        .then(buf => {
            return buf.toString()
        })
}

// only opts accept object which will be replace by value
export function only(obj, keys: string | Array<string>, opts?: {}): {} {
    !obj && (obj = {})

    let replace = opts ? true : false

    if (typeof keys === 'string')
        keys = keys.split(/ +/)
    return keys.reduce((pre, curr) => {
        if (obj[curr] === null) {
            return pre
        }
        if (replace) {
            if (typeof opts![curr] !== 'undefined') {
                pre[opts![curr]] = obj[curr]
                return pre
            }
        }
        pre[curr] = obj[curr]
        return pre
    }, {})
}

export function except(obj, keys: string | Array<string>): {} {
    !obj && (obj = {})

    if (typeof keys === 'string')
        keys = keys.split(/ +/)

    let ks = keys as Array<string>
    return Object.keys(obj).reduce((pre, curr) => {
        if (ks.indexOf(curr) >= 0) {
            return pre
        }
        pre[curr] = obj[curr]
        return pre
    }, {})
}

export function merge(srcObj, more): {} {
    let src = {}
    Object.assign(src, srcObj, more)
    return src
}

export function isClass(fn: any) {
    return typeof fn === 'function' &&
        /^class\s/.test(Function.prototype.toString.call(fn))
}

export function formatDate(d: string): string {
    let slice = new Date(d).toLocaleDateString('zh-CN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Asia/Shanghai',
    }).split('/')
    return `${slice[2]}-${slice[0]}-${slice[1]}`
}