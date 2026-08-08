import os from "node:os";
import { EventEmitter } from 'events';
import path from 'node:path';
import { Worker } from 'worker_threads';
import fsPromises from "node:fs/promises";
import CallbackRunner from "./CallbackRunner.js";
import EventManager from "../EventManager.js";
import Serialize from "../Utils/Serialize.js";
import SystemConfigService from "../services/SystemConfig.js";
const __dirname = import.meta.dirname;
const em = new EventManager();
const kTaskCallback = Symbol('kTaskCallback');
const kTaskParam = Symbol('kTaskParam');
const AutoWorkIntervalUnread = Symbol('AutoWorkIntervalUnread');
/**
 * 线程空闲事件
 */
const kWorkerFreedEvent = Symbol('kWorkerFreedEvent');

const MAX_THREAD_NUM = 10;

let isAWRunning = false;        //正在运行自动作业

/**
 * 线程池
 */
export default class WorkerPool extends EventEmitter {
    /**
     * 创建简易线程池
     * @param {int} numThreads 最大线程数 默认为运行环境cpu内核数少2个，最少2个。
     */
    constructor(numThreads = 0) {
        if (_Singleton_WorkerPool != null) { return _Singleton_WorkerPool; }

        super();

        if (numThreads == 0) {
            const cpuNum = os.cpus().length;
            numThreads = Math.min(cpuNum, MAX_THREAD_NUM);
        }

        /**
         * 自动作业配置
         */
        this.autoWorkInterval = AutoWorkIntervalUnread;
        this.isRunAutoWorker = false;// this.autoWorkInterval > 0;

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

        /**
         * 线程自动释放关闭
         */
        this.workerWatcher = setInterval(() => {
            if (this.freeWorkers.length == 0) return;
            let lazyWorker = this.freeWorkers.reduce((prev, current) => { return prev.WaitingTime > current.WaitingTime ? prev : current; });
            if (!lazyWorker) return;

            if (this.workers.length <= 1) return;       //至少保留一个线程
            let workerId = this.workers.indexOf(lazyWorker);
            this.workers.splice(workerId, 1);
            let freeWorkersId = this.freeWorkers.indexOf(lazyWorker);
            this.freeWorkers.splice(freeWorkersId, 1);
            lazyWorker.terminate().then(() => {
                em.emit("Debug.Log", `释放资源，关掉长期闲置线程。ID: ${lazyWorker.ID}\t已闲置${feeTime / 1000}秒。`, "WORKERPOOL");
            }).catch((err) => {
                em.emit("Debug.Log", `尝试关闭闲置线程出错，可能存在内存泄漏。ID: ${lazyWorker.ID}, error: ${err.message}`, "WORKERPOOL", Serialize.Error(err));
            });
        }, 90 * 1000);

        this._latestAutoWorkTime = Date.now();
        this.autoWorkWatcher = setInterval(async () => {
            //初始化任务执行间隔
            if (this.autoWorkInterval === AutoWorkIntervalUnread) {
                this.autoWorkInterval = await SystemConfigService.getConfig(SystemConfigService.Group.SYSTEM_AUTO_WORKER, "run_interval") * 1;
                this.isRunAutoWorker = this.autoWorkInterval > 0;
            }

            if (this.freeWorkers.length == 0) return;   //没有闲置资源，跳过本次自动任务
            if (!this.isRunAutoWorker) return;      //没启用自动任务配置，跳过本次

            let feeTime = Date.now() - this._latestAutoWorkTime;
            if (feeTime >= this.autoWorkInterval) {//当有线程闲置超过x小时（360_0000ms）后，才执行自动进程
                this._latestAutoWorkTime = Date.now();
                this.AutoWorkWatcher();
            }
        }, 120_000);

        let createNum = 2;// Math.max(this.numThreads / 2, 2);      //启动时创建的线程数，默认先创建2个
        for (let i = 0; i < createNum; i++)
            this.AddNewWorker();

        em.emit("WorkerPool.Init", {
            MaxThread: this.maxThreadsNum,
            NowWorker: this.workers.length,
            FreeWorker: this.freeWorkers.length
        });

        /**
         * 需要按类型限制总运行数量的线程运行数统计    
         * key: 任务类型    
         * value: 当前类型运行的线程-**数量**
         */
        this.runningThreadCountByType = new Map();
        this.on(kWorkerFreedEvent, (taskType) => {
            let tt = this.waitingTask.get(taskType || "");
            if (taskType && tt && tt.length > 0) {      //释放限定进程后，优先处理同类进程需求
                let p = tt.shift();
                this.RunTask(p.taskParam, p.callback);
            } else {
                for (let curType of this.waitingTask.keys()) {
                    if (curType == taskType) continue;
                    let taskList = this.waitingTask.get(curType);
                    if (taskList.length == 0) continue;
                    if (this.runningThreadCountByType.get(curType) >= taskList[0]?.taskParam?.maxThreadNum) continue;

                    let p = taskList.shift();
                    this.RunTask(p.taskParam, p.callback);
                    break;
                }
            }
        });

        if (_Singleton_WorkerPool == null) _Singleton_WorkerPool = this;
        em.emit("Debug.Model.Init.Finish", "WorkerPool");
    }

    /**
     * 创建一个执行线程
     */
    AddNewWorker() {
        const worker = new Worker(path.resolve(__dirname, 'WorkerRunner.js'));
        const handleError = (err, result) => {
            const runTime = Date.now() - worker.StartTime;
            worker.StartTime = 0;
            worker.WaitingTime = Date.now();

            //若有回调的话，将错误发到回调上
            if (worker[kTaskCallback])
                worker[kTaskCallback].Done(err, result);      //出错时的回调
            else
                this.emit('error', err);

            let taskParam = worker[kTaskParam];
            let workerId = this.workers.indexOf(worker);

            //限制总数类的线程数量释放
            if (taskParam.taskType && taskParam.maxThreadNum > 0) {
                let curNum = this.runningThreadCountByType.get(taskParam.taskType) || 1;
                this.runningThreadCountByType.set(taskParam.taskType, curNum - 1);
            }

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
                RunTime: runTime,
                err: err
            });
        };

        worker.on('message', async (result) => {      //执行后主线程监听结果
            if (result.type === "error") return handleError(result.err);//线程捕获的错误
            const runTime = Date.now() - worker.StartTime;
            worker.StartTime = 0;
            worker.WaitingTime = Date.now();
            try {
                /*
                    # 注意：这里不等待回调执行完成，因为回调中可能会有异步操作，导致线程池阻塞
                    # 如果线程以类似递归形式调用时，当线程队列超过最大线程数时，新增线程在排队，原线程又不能释放并向后调度。
                */
                /* await */ worker[kTaskCallback].Done(null, result);       //CallbackRunner.Done 执行回调
            } catch (callbackError) {
                return handleError(callbackError, result);//线程已执行成功，执行回调出错
            }

            //释放线程，将worker回收
            const taskParam = worker[kTaskParam];
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
                Id: this.workers.indexOf(worker),
                RunTime: runTime
            });
        });
        worker.StartTime = 0;
        worker.WaitingTime = Date.now();
        worker.ID = Math.random().toString(36).substring(2, 15);
        worker.on('error', handleError);
        this.workers.push(worker);
        this.freeWorkers.push(worker);
        this.emit(kWorkerFreedEvent);
    }

    /**
     * 启用一个线程，
     * @param {{taskfile,param,taskType,maxThreadNum,highPriority}} taskParam 
     * ```js
        {
            taskfile,   //模块文件地址，可以用 ‘@’ 代表根目录。
            param,      //线程执行的传入参数，要求为可序列化的内容
            taskType,   //可选，按类别限制线程最大数控制时，用于区别线程类别
            maxThreadNum,//可选，当taskType不为空时，用于限制指定类别的线程最大数量。
            highPriority,//可选，是否优先执行，默认为false
        }
     *
     * ```
     * @param {(result: object|null, err: object|null) => void} callback 线程结束后的回调，如果线程运行出错，result的值将为null
     */
    RunTask(taskParam, callback) {
        //排队机制
        //总线程已满
        if (this.freeWorkers.length === 0) {
            this.WaitingTask(taskParam, callback);
            em.emit("Debug.Log", "已达到总最大线程数，需要等待资源", "WORKERPOOL");
            if (this.maxThreadsNum > this.workers.length) this.AddNewWorker();
            return;
        }
        //线程数需按类型限制
        if (taskParam.taskType && taskParam.maxThreadNum > 0) {
            let curTypeNum = this.runningThreadCountByType.get(taskParam.taskType) || 0;
            //按类型限制的线程已满
            if (curTypeNum > taskParam.maxThreadNum) {
                this.WaitingTask(taskParam, callback);
                em.emit("Debug.Log", `已达到当前类别的最大线程数(${taskParam.maxThreadNum}-${curTypeNum})，需要等待资源`, "WORKERPOOL", taskParam.taskType);
                return;
            }
            this.runningThreadCountByType.set(taskParam.taskType, curTypeNum + 1);
        }

        const worker = this.freeWorkers.shift();//空闲线程
        worker.StartTime = Date.now();  //记录进程启动时间

        em.emit("WorkerPool.Worker.Start", {
            MaxThread: this.maxThreadsNum,
            NowWorker: this.workers.length,
            FreeWorker: this.freeWorkers.length,
            Task: taskParam.taskfile,
            Id: this.workers.indexOf(worker)
        });

        worker[kTaskParam] = taskParam;
        worker[kTaskCallback] = new CallbackRunner(callback);//将异步的callback封装到WorkerPoolTaskInfo中，赋值给worker.kTaskInfo.

        worker.postMessage(taskParam);      //发到线程上运行 //子线程开始执行
    }

    /**
     * 以异步形式启用一个线程
     * @param {{taskfile,param,taskType,maxThreadNum}} taskParam 
     * ```js
        {
            taskfile,   //模块文件地址，可以用 ‘@’ 代表根目录。
            param,      //线程执行的传入参数，要求为可序列化的内容
            taskType,   //可选，按类别限制线程最大数控制时，用于区别线程类别
            maxThreadNum,//可选，当taskType不为空时，用于限制指定类别的线程最大数量。
            highPriority,//可选，是否优先执行，默认为false
        }
     *
     * ```
     */
    RunTaskAsync(taskParam) {
        return new Promise((resolve, reject) => {
            this.RunTask(taskParam, (result, error) => {
                if (error) return reject(error);
                resolve(result);
            });
        });
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

        if (taskParam.highPriority)
            taskList.unshift({ taskParam, callback });      //插队，排到队列头
        else
            taskList.push({ taskParam, callback });
    }

    /**
     * 自动作业
     */
    async AutoWorkWatcher() {
        if (!this.isRunAutoWorker) return;
        if (isAWRunning) return;
        isAWRunning = true;
        const startTime = new Date();
        try {
            const awPath = path.join(__dirname, "AutoWork");
            console.log(`[${startTime.toLocaleString()}]\t自动作业已启动。`);

            const files = await fsPromises.readdir(awPath);
            for (const filename of files) {
                if (!filename.endsWith(".js")) continue;
                let file = path.join(awPath, filename);
                import(file).then(job => {
                    job.Run();
                }).catch(err => { throw err });
            }
        } catch (err) {
            console.error(`[${startTime.toLocaleString()}]\t自动作业运行失败：`, err)
        }
        finally {
            isAWRunning = false;
            const timeNow = new Date();
            console.log(`[${timeNow.toLocaleString()}]\t自动作业已完成，耗时：${(timeNow - startTime) / 1000}s。`)
        }
    }

    /**
     * 关闭线程池，结束所有线程
     */
    Close() {
        clearInterval(this.workerWatcher);
        clearInterval(this.autoWorkWatcher);
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

    /**
     * 获取进程池信息
     * @returns 
     */
    static GetStatus() {
        let getWorkerData = (worker) => {
            return {
                ID: worker.ID,
                RunTime: worker.StartTime > 0 ? (Date.now() - worker.StartTime) : 0,
                WaitTime: Date.now() - worker.WaitingTime,
                Param: worker.StartTime === 0 ? null : Object.assign({}, worker[kTaskParam]),
            }
        }

        let wtTask = [];
        if (_Singleton_WorkerPool.waitingTask.size > 0) {
            _Singleton_WorkerPool.waitingTask.keys().forEach(key => {
                wtTask.push({
                    type: key,
                    list: [..._Singleton_WorkerPool.waitingTask.get(key)],
                })
            });
        }

        return {
            // 最大线程数
            MaxThread: _Singleton_WorkerPool.maxThreadsNum,
            // 当前线程数
            NowWorker: _Singleton_WorkerPool.workers.length,
            // 空闲线程
            FreeWorker: _Singleton_WorkerPool.freeWorkers.map(worker => getWorkerData(worker)),
            //正在运行的任务
            // RunningTask: _Singleton_WorkerPool.workers.map(worker => getWorkerData(worker)),
            //等待任务列表
            WaitingTask: wtTask,
            //所有线程
            WorkerPool: _Singleton_WorkerPool.workers.map(worker => getWorkerData(worker)),
        };
    }
}

/**
 * 线程池唯一实例
 */
let _Singleton_WorkerPool = null;