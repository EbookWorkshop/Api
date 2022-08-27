const router = require('koa-router')()
// const { loadavg } = require('os');
const path = require('path')
const fs = require('fs');

const load = async (dir, cb) => {
    // 获取dir的路径
    const url = path.resolve(__dirname, dir);
    // 获取dir文件夹下的文件内容
    const files = fs.readdirSync(url);  //加载指定目录
    // 遍历文件
    files.forEach((filename) => {
        if (__filename.endsWith(filename)) return;    //防止加载当前文件

        filename = filename.replace('.js', '');
        const routes = require(`${url}/${filename}`);
        cb(filename, routes);
    })
}

//加载当前文件夹下所有js结尾的文件作为控制器
//如 func1.js 含对应路由规则：`get /test`，映射的路由为：/func1/test
load("./", (filename, routes) => {
    const prefix = filename === 'index' ? '' : `/${filename}`;      //控制器文件名为一级路由
    if (typeof (routes) === "function") routes = routes();
    Object.keys(routes).forEach(key => {
        const [method, path] = key.split(' ');
        // 注册路由
        if (method === "router") {
            router.use(routes[key]);
        } else {
            router[method](prefix + path, routes[key]);
        }
    })
})

module.exports = router;