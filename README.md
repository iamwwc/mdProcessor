## 2020-8-10 更新

偶然间发现自己大二写的代码，当年雄心勃勃地要说正在开发，现在2020年，转眼已经毕业，这个项目也就顺其自然烂尾了。

当年开发的需找到了替代，不会再维护这个仓库。

想想还是留下这个仓库做个纪念吧 :)

以下为原内容
----------------------------------
根目录为Hexo的source目录

所以以`_`开头的文件夹都会被markdown处理，path为路径名去掉`_`加文件title

配置文件中可以指定额外忽略的文件夹和文件

最后将整个source目录挂在到nginx root下

应该单独存放source，确保可以被 nginx 访问，这样docker创建额外的volume

backend 和 nginx container 通过这个 volume 共享 source

并且由于下划线开头的文件夹会被处理，所以 nginx 应该配置规则，dist 开头的应转发给 ssr-server

nginx 对于 dist转发给 ssr server

_开头的可以访问

并且要确保当没有匹配到路径的时候要重定向到index.html
让前端路由处理

这样ssr-server build之后的js 和manifest不需要放到nginx，留在ssr container dist目录就可以



*当前查询接口只接受 GET*

对于参数只允许以 `query string` 的格式提交

对于 `/api/blog` 的请求，由于路径中可能会包含中文字符，所以要求全部的请求必须经过 `encodeURIComponent` 编码 和 `decodeURIComponent` 解码

对于查询，返回的格式如下

```ts
interface SimplePost {
    title: string // 用于tags，记录 某个 tag 中全部post的简要信息
    path: string
}

export interface Post {
    title: string //post格式
    path: string

    matter: any // 仿照 Hexojs, 存储经markdown 首部 front-matter 解析出的数据

    allowComments: boolean,

    excerpt: string,
    fullContent: string,
    raw: string,


    originDate, updatedDate: string,

    prevPost, nextPost: SimplePost | null
}

export interface Result {
    status: string,
    detail?: string,
    result?: string | Object
}
```

`status` 只有 `success` 或者 `failed`

`detail` 用于 `status` 为 `failed` 的信息描述

如果查询 `miss`，即 查询结果(Array) length 为 0 ，那么`result`会置 `null`


如果查询 `hit`

如果 `Array.length === 0 `, 则 `result` 为 `null`

其余情况直接返回 `Array`，将判断放到client 处理


```ts
interface Tag{
    posts: Array<SimplePost>
}
```



对于查询参数

格式为

```ts
interface QueryParams{
    type: string // post | tag
    name?: string // tag 名字， type 为post时省略
    path?: string //post 路径， type 为tag时省略
}
```


------------------------------------

发送给接口时会经过下面代码构造查询字符串

```js
let queryString = Object.keys(params).reduce((prev,curr,currIndex,src) => {
        let encoded = encodeURIComponent(params[curr])
        prev = prev + `${curr}=${encoded}`
        return currIndex === src.length - 1 ? prev : prev +='&'
},``)
```


### 大体设计

这是一个将会用到现在正在开发的blog系统的后端api服务

仿照 `Hexojs` 实现了core 和plugins 和设计

core继承自 nodejs 的 EventEmitter

在不同的阶段 core 会发布相应的事件

全部的功能

    1. 提取post， tag 变量数据
    2. 解析 front-matter
    3. 渲染markdown
    4. api 接口

全部通过插件的形式提供

内部插件直接 import 相应的文件 并判断 导出的是 `class` 还是 `function` 以此来决定是 `new` 还是 `fn.call（this)` 

大体处理如下

```ts

private async loadInternalPlugins() {
        const fns = await import('./plugins/index');
        let promises =  Object.keys(fns).map(async fn => {
            let f = fns[fn]
            return await isClass(f) ? (new f(this)) : f.call(this)
        });

        return Promise.all(promises)
}

```

参考 Hexo 的源代码 [loadPlugins] (https://github.com/hexojs/hexo/blob/master/lib/hexo/index.js#L211) 实现了自己的加载外部插件的功能


在运行时将server实例注入

```ts
private async doLoadPlugin(path: string) {
        const self = this
        let script = await readFileAsync(path);
        const module = new Module(path);
        module.filename = path;
        let require: Function = Module.createRequireFromPath(path);
        script = `(function(exports, require, module, __filename, __dirname, server){${script}});`;
        const fn = vm.runInThisContext(script, path);
        return fn(module.exports, require, module, path, nodePath.dirname(path), self);
    }
```

#### 一些注意事项


