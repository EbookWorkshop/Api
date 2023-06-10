const { AsyncResource } = require('async_hooks');
const { EventEmitter } = require('events');
const path = require('path');
const { Worker } = require('worker_threads');
const EventManager = require("./../EventManager");
const em = new EventManager();

const kCallback = Symbol('kCallback');
const kTaskCallback = Symbol('kTaskCallback');
const kTaskParam = Symbol('kTaskParam');
const kWorkerFreedEvent = Symbol('kWorkerFreedEvent');

/**
 * 执行回调函数用
 */
class WorkerPoolTaskInfo extends AsyncResource {
    constructor(callback) {
        super('WorkerPoolTaskInfo');
        this.callback = callback;
    }

    /**
     * 回调处理-执行回调
     * @param {*} err 错误信息
     * @param {*} result 回调的结果
     */
    Done(err, result) {
        this.runInAsyncScope(this.callback, null, result, err);
        this.emitDestroy();  // `TaskInfo`s are used only once.
    }
}

/**
 * 线程池
 */
class WorkerPool extends EventEmitter {
    /**
     * 创建简易线程池
     * @param {int} numThreads 最大线程数 默认为运行环境cpu内核数少2个，最少2个。
     */
    constructor(numThreads = 0) {
        if (_Singleton_WorkerPool != null) { return _Singleton_WorkerPool; }

        super();

        if (numThreads == 0) {
            const os = require('os');
            numThreads = Math.max(os.cpus().length - 2, 2);
        }

        /**
         * 最大线程总数
         */
        this.maxThreadsNum = numThreads;
        /**
         * 已激活线程池
         */
        this.workers = [];
        /**
         * 空闲可用线程
         */
        this.freeWorkers = [];
        /**
         * 排队中的任务
         */
        this.waitingTask = new Map();

        let createNum = 2;// Math.max(this.numThreads / 2, 2);      //启动时创建的线程数，默认先创建2个
        for (let i = 0; i < createNum; i++)
            this.AddNewWorker();

        em.emit("WorkerPool.Init", {
            MaxThread: this.maxThreadsNum,
            NowWorker: this.workers.length,
            FreeWorker: this.freeWorkers.length
        });

        //需要按类型限制总运行数量的线程运行数统计
        this.runningThreadCountByType = new Map();
        this.on(kWorkerFreedEvent, (taskType) => {
            let tt = this.waitingTask.get(taskType || "");
            if (taskType && tt && tt.length > 0) {
                let p = tt.shift();
                this.RunTask(p.taskParam, p.callback);
            } else {
                for (var curType of this.waitingTask.keys()) {
                    if (curType == taskType) continue;
                    let taskList = this.waitingTask.get(curType);
                    if (this.runningThreadCountByType.get(curType) >= taskList[0]?.taskParam?.maxThreadNum) continue;

                    let runTask = taskList.shift();
                    this.RunTask(runTask.taskParam, runTask.callback);
                    break;
                }
            }
        });

        if (_Singleton_WorkerPool == null) _Singleton_WorkerPool = this;
    }

    /**
     * 创建一个执行线程
     */
    AddNewWorker() {
        const worker = new Worker(path.resolve(__dirname, 'WorkerRunner.js'));
        worker.on('message', (result, err) => {      //执行后主线程监听结果

            let taskParam = worker[kTaskParam];
            worker[kTaskCallback].Done(err, result);       //WorkerPoolTaskInfo.Done 执行回调
            worker[kTaskCallback] = null;
            worker[kTaskParam] = null;

            this.freeWorkers.push(worker);
            this.emit(kWorkerFreedEvent, taskParam.taskType);

            //限制总数类的线程数量释放
            if (taskParam.taskType && taskParam.maxThreadNum > 0) {
                let curNum = this.runningThreadCountByType.get(taskParam.taskType) || 1;
                this.runningThreadCountByType.set(taskParam.taskType, curNum - 1);
            }

            em.emit("WorkerPool.Worker.Done", {
                MaxThread: this.maxThreadsNum,
                NowWorker: this.workers.length,
                FreeWorker: this.freeWorkers.length,
                Task: taskParam.taskfile,
                Id: this.workers.indexOf(worker)
            });
        });

        worker.on('error', (err) => {
            //若有回调的话，将错误发到回调上
            if (worker[kTaskCallback])
                worker[kTaskCallback].Done(err, null);      //方案2
            else
                this.emit('error', err);

            let taskParam = worker[kTaskParam];
            let workerId = this.workers.indexOf(worker);

            //删掉当前线程，换一个新的。以防线程跑飞后越来越少可用线程
            this.workers.splice(workerId, 1);
            this.AddNewWorker();

            worker.terminate(); //尝试关掉这个进程

            em.emit("WorkerPool.Worker.Error", {
                MaxThread: this.maxThreadsNum,
                NowWorker: this.workers.length,
                FreeWorker: this.freeWorkers.length,
                Id: workerId,
                Task: taskParam.taskfile,
                err: err
            });
        });
        this.workers.push(worker);
        this.freeWorkers.push(worker);
        this.emit(kWorkerFreedEvent);
    }

    /**
     * 启用一个线程，
     * @param {{taskfile,param,taskType,maxThreadNum}} taskParam ```js
        {
            taskfile,   //模块文件地址，可以用 ‘@’ 代表根目录。
            param,      //线程执行的传入参数，要求为可序列化的内容
            taskType,   //可选，按类别限制线程最大数控制时，用于区别线程类别
            maxThreadNum//可选，当taskType不为空时，用于限制指定类别的线程最大数量。
        }
     *
     * ```
     * @param {function(param,err)} callback 线程结束后的回调
     */
    RunTask(taskParam, callback) {
        //排队机制
        //总线程已满
        if (this.freeWorkers.length === 0) {
            this.WaitingTask(taskParam, callback);
            console.debug("已达到总最大线程数，需要等待资源");
            if (this.maxThreadsNum > this.workers.length) this.AddNewWorker();
            return;
        }
        //线程数需按类型限制
        if (taskParam.taskType && taskParam.maxThreadNum > 0) {
            let curTypeNum = this.runningThreadCountByType.get(taskParam.taskType) || 0;
            //按类型限制的线程已满
            if (++curTypeNum > taskParam.maxThreadNum) {
                this.WaitingTask(taskParam, callback);
                console.debug("已达到当前类别的最大线程数，需要等待资源", taskParam.taskType);
                return;
            }
            this.runningThreadCountByType.set(taskParam.taskType, curTypeNum);
        }

        const worker = this.freeWorkers.shift();//空闲线程

        em.emit("WorkerPool.Worker.Start", {
            MaxThread: this.maxThreadsNum,
            NowWorker: this.workers.length,
            FreeWorker: this.freeWorkers.length,
            Task: taskParam.taskfile,
            Id: this.workers.indexOf(worker)
        });

        worker[kTaskParam] = taskParam;
        worker[kCallback] = callback;
        worker[kTaskCallback] = new WorkerPoolTaskInfo(callback);//将异步的callback封装到WorkerPoolTaskInfo中，赋值给worker.kTaskInfo.


        worker.postMessage(taskParam);      //发到线程上运行
    }

    /**
     * 安排任务排队
     * @param {{taskfile,param,taskType,maxThreadNum}} taskParam ```js
        {
            taskfile,   //模块文件地址，可以用 ‘@’ 代表根目录。
            param,      //线程执行的传入参数，要求为可序列化的内容
            taskType,   //可选，按类别限制线程最大数控制时，用于区别线程类别
            maxThreadNum//可选，当taskType不为空时，用于限制指定类别的线程最大数量。
        }
     *
     * ```
     * @param {function(param,err)} callback 线程结束后的回调
     */
    WaitingTask(taskParam, callback) {
        let taskList = this.waitingTask.get(taskParam.taskType || "");
        if (!taskList) {
            taskList = [];
            this.waitingTask.set(taskParam.taskType || "", taskList);
        }

        taskList.push({ taskParam, callback });
    }

    /**
     * 关闭线程池，结束所有线程
     */
    Close() {
        for (const worker of this.workers) worker.terminate();
        this.workers = [];
        this.freeWorkers = [];
    }

    /**
     * 取得线程池唯一实例
     * @returns {WorkerPool} 线程池唯一实例
     */
    static GetWorkerPool() {
        if (_Singleton_WorkerPool === null) _Singleton_WorkerPool = new WorkerPool();

        return _Singleton_WorkerPool;
    }
}

/**
 * 线程池唯一实例
 */
let _Singleton_WorkerPool = null;
module.exports = WorkerPool;