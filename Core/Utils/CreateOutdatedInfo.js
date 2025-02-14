const { exec } = require('child_process');
/**
 * 执行`npm outdated`取得可升级包信息   
 * 注意这个方法运行会报错，但能正常生成文件    
 * ***不要在主线程直接运行***
 * @returns 
 */
function CreateOutdatedInfo() {
    return new Promise((resolve, reject) => {
        // console.log("正在更新包信息。")
        exec("npm outdated -json > Entity/outdated.json", (error, stdout, stderr) => {
            if (error || stderr) {
                reject(error);
                return;
            }
            resolve(stdout);
        });
    });
}


/**
 * 多线程执行入口
 * @param {{url:string, savePath:string}} param 参数
 * @returns {Promise<bool>}
 */
async function RunTask(param) {
    return CreateOutdatedInfo(param);
}

module.exports = {
    RunTask
}