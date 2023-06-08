/**
 * 多线程线程运行器，用来分发实际的任务
 * 需要支持多线程的文件抛出 RunTask
 */




const { parentPort } = require('worker_threads');
parentPort.on('message', (task) => {
    try {
        let { taskfile, param } = task;
        let result = null;

        let { RunTask } = require(GetRealFilePath(taskfile));        //取得需要在线程运行的文件
        result = RunTask(param);

        parentPort.postMessage(result);//执行完成，往主线程发送结果
    } catch (err) {
        console.error("线程执行出错：", err);
    }
});



/**
 * 扩展地址表达式，用于实现根目录的功能
 * @param {*} pathSetting 
 */
function GetRealFilePath(pathSetting) {
    if (!pathSetting.startsWith("@")) return pathSetting;

    let root = __dirname.replace(/(?:[\//]+)Core[\//]Worker[\//]?/, "");
    console.debug("服务器根目录", root)

    return pathSetting.replace("@", root);
}