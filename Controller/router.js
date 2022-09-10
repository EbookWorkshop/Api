const router = require('koa-router')()
// const { loadavg } = require('os');
const path = require('path')
const fs = require('fs');

const EventManager = require("./../Core/EventManager");
const em = new EventManager();

/**
 * 路由模块装载器
 * 如 func1.js 含对应路由规则：`get /test`，映射的路由为：/func1/test
 * @param {string} dir 装载的当前目录
 * @param {string} fatherRouter 父级路由
 * @param {function} cb_loader 配置器
 */
async function load(dir, fatherRouter, cb_loader) {
    // 获取dir的路径
    const url = path.resolve(__dirname, dir);
    // 获取dir文件夹下的文件内容
    const files = fs.readdirSync(url);  //加载指定目录
    // 遍历文件
    files.forEach((filename) => {
        if (__filename.endsWith(filename)) return;    //防止加载当前文件
        if (filename === "index.js") return;        //index通过目录形式加载
        if (!filename.endsWith('.js') && /[^\.]+\.[^\/]+$/.test(filename)) return;      //不加载有后缀但不是js的文件

        let curfilename = filename.replace('.js', '');
        try {
            const routes = require(`${url}/${curfilename}`);        //实际加载模块
            cb_loader(curfilename, fatherRouter, routes);
        } catch (err) {
            console.warn(`加载路由失败：${err.message}`);//有可能是目录情况但当前目录没有index.js
            // return;
        }

        //递归加载子目录
        if (!filename.endsWith(".js"))
            load(`${dir}/${curfilename}`, curfilename, cb_loader);
    });
}

/**
 * 路由配置器
 * @param {string} filename 加载的文件/目录名
 * @param {string} fatherRouter 父级路由（文件夹名）
 * @param {function|object} routes require之后的模块内容
 */
function loader(filename, fatherRouter, routes) {
    const prefix = fatherRouter !== "" ? `/${fatherRouter}/${filename}` : `/${filename}`;      //控制器文件名为一级路由

    if (typeof (routes) === "function") //模块文件导出为function形式的处理
        routes = routes();

    Object.keys(routes).forEach(key => {
        const [method, path] = key.split(' ');
        // 注册路由
        em.emit("Debug.Log", `已加载路由：\t[${method.toUpperCase()}]\t${prefix + path}\t\t${__filename}`,);
        router[method.toLowerCase()](prefix + path, (ctx) => {
            ctx.set('Content-Type', 'application/json');    //统一所有路由默认json返回格式
            return routes[key](ctx);
        });
    })
}

//加载当前文件夹下所有js结尾的文件作为控制器
load("./", "", loader)

module.exports = router;