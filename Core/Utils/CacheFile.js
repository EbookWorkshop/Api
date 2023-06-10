//缓存、下载文件到服务器指定地址
const https = require("https");

/**
 * 缓存照片
 * @param {*} url Web文件地址
 * @param {*} savePath 存储地址
 */
function CacheFile(url, savePath) {
    return new Promise((resolve, reject) => {
        try {
            const req = https.request(url, (res) => {
                res.pipe(fs.createWriteStream(savePath));
                resolve(true);
                req.end();//
            });
        } catch (err) {
            console.warn("获取图片失败:", url, err)
            reject(false, err);
        }
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