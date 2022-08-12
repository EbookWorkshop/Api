/**
 * 多线程线程运行器，用来分发实际的任务
 * 需要支持多线程的文件抛出 RunTask
 */


const { parentPort } = require('worker_threads');
parentPort.on('message', (task) => {
    let { taskfile, param } = task;
    let result = null;

    let { RunTask } = require(taskfile);        //取得需要在线程运行的文件
    result = RunTask(param);

    parentPort.postMessage(result);//执行完成，往主线程发送结果
});