//缓存、下载文件到服务器指定地址
const https = require("https");
let { URL } = require("url");
console.info("----------  下列警告忽略  ------------")
const { AddFile } = require("./../services/file.mjs");          //这里会得到一个node警告（node:16472），因为在CJS模块中引入了ESM模块，但是不影响使用（当前node版本为实验性功能）
console.info("----------  上述警告忽略  ------------")

/**
 * 缓存照片
 * @param {*} url Web文件地址
 * @param {*} savePath 存储地址
 */
function CacheFile(url, savePath) {
    return new Promise((resolve, reject) => {
        let tUrl = new URL(url);
        // 发送一个请求到代理服务器
        const options = {
            method: "GET",
            headers: {
                'Content-Type': `application/x-www-form-urlencoded`,
                'Content-Length': 0
            },
            hostname: tUrl.hostname,
            path: tUrl.pathname + (tUrl.search || ""),
            port: tUrl.port,
            rejectUnauthorized: false    //忽略证书校验
        };

        const req = https.request(options, (res) => {
            if (res.statusCode < 200 || res.statusCode > 302) {
                let err = new Error(`${url} 返回状态：${res.statusCode} - ${res.statusMessage}`);
                reject(err);
                return;
            }

            AddFile(res, savePath).then((res) => {
                resolve(true);
            }).catch((err) => {
                reject(err);
            });
        });
        req.on('error', (err) => {
            reject(err);
        })
        req.end();
    });
}


/**
 * 多线程执行入口
 * @param {{url:string, savePath:string}} param 参数
 * @returns {Promise<bool>}
 */
async function RunTask(param) {
    // if (param.em) em = param.em;        //如果是线程来的，则要用主线程的EM发信息才能被捕捉
    return CacheFile(param.url, param.savePath);
}


module.exports = {
    CacheFile,
    RunTask
}