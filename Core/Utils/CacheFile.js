//缓存、下载文件到服务器指定地址
const https = require("https");
let { URL } = require("url");
const fs = require("fs");

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
            try {
                const fStream = fs.createWriteStream(savePath);
                res.pipe(fStream);

                fStream.on("finish", () => {
                    resolve(true);
                });
            } catch (err) {
                reject(false, err);
            }
        });
        req.on('error', (err) => {
            console.warn("获取图片失败:", url, err)
            reject(false, err);
            // throw err;
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
    return CacheFile(param.url, param.savePath);
}


module.exports = {
    CacheFile,
    RunTask
}