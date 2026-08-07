import { exec } from 'child_process';
import fsp from "node:fs/promises";
const execAsync = (cmd) => new Promise((resolve, rejects) => {
    exec(cmd, (error, stdout, stderr) => {
        if (stdout) resolve(stdout);
        else if (error) rejects(error);
        else console.warn(`命令${cmd}执行错误：`, error, "\n结果：\n", stdout);
    });
})

/**
 * 执行`npm outdated`取得可升级包信息   
 * 注意这个方法运行会报错，但能正常生成文件    
 * ***不要在主线程直接运行***
 * @returns 
 */
function CreateOutdatedInfo() {
    return Promise.all([
        execAsync("npm outdated -json"),        //注意：这个命令并不能正确退出，会导致exec的回调参数error不为空，直接采用stdout的结果即可
        execAsync("npm list -json")
    ]).then(async (result) => {
        const [odf, plist] = result.map((s) => JSON.parse(s));

        const versionInfo = Object.assign({}, plist.dependencies);
        for (var k in odf) versionInfo[k] = Object.assign({}, versionInfo[k], odf[k]);
        await fsp.writeFile("./Entity/version.json", JSON.stringify(versionInfo, null, 2));
        return true;
    }).catch((err) => {
        console.log(`[${new Date().toLocaleString()}]\t出错： CreateOutdatedInfo\n${err}`);
        throw err;
    });
}


/**
 * 多线程执行入口
 * @param {{url:string, savePath:string}} param 参数
 * @returns {Promise<bool>}
 */
export async function RunTask(param) {
    return CreateOutdatedInfo(param);
}
