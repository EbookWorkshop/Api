/**
 * 多线程线程运行器，用来分发实际的任务
 * 需要支持多线程的文件抛出 RunTask
 * RunTask 的入参，出参只支持可序列化对象
 */


//# 注意：当前将在线程中执行，直接使用单实例的模块将导致再次创建实例

import { parentPort } from 'worker_threads';
import Serialize from "../Utils/Serialize.js";
import { als } from './AsyncStorage.js';

const __dirname = import.meta.dirname;
//子线程开始执行
parentPort.on('message', async (task) => {
    try {
        let { taskfile, param } = task;
        let result = null;

        als.run({ entryPath: taskfile }, async () => {//为子线程创建一个运行上下文，可以用于传送信息、调试等
            const { RunTask } = await import(GetRealFilePath(taskfile));        //取得需要在线程运行的文件
            result = RunTask(param);

            if (result instanceof Promise) {
                result.then((rsl) => {
                    parentPort.postMessage(rsl);//如果有不可序列化内容则会报错
                }).catch(err => {
                    if (err == null) err = { message: "线程错误：未知错误", param, taskfile };

                    let error = Serialize.Error(err);
                    parentPort.postMessage({ type: "error", err: error });
                })
            } else {
                parentPort.postMessage(Serialize.Result(result));//执行完成，往主线程发送结果 注意：如果result存在不可克隆内容，会导致出错
            }
        });
    } catch (err) {
        if (err.message == "RunTask is not a function")
            console.warn(`尚未实现多线程接口 RunTask：\t${task.taskfile}`);
        else
            console.error("线程执行出错：", err, task);
    }
});



/**
 * 扩展地址表达式，用于实现根目录的功能
 * @param {*} pathSetting 
 */
function GetRealFilePath(pathSetting) {
    if (!pathSetting.startsWith("@")) return pathSetting;

    let root = __dirname.replace(/(?:[\\/]+)Core[\\/]Worker[\\/]?/, "");
    let path = pathSetting.replace("@", root);
    return path;
}