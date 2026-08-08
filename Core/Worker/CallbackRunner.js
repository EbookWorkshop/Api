import { AsyncResource } from 'async_hooks';
import Serialize from "../Utils/Serialize.js";
import EventManager from "../EventManager.js";
const em = new EventManager();

/**
 * 线程的回调函数执行器
 */
export default class CallbackRunner extends AsyncResource {
    constructor(callback) {
        super('CallbackRunner');
        this.callback = callback;
    }

    /**
     * 回调处理-执行回调
     * @param {*} err 错误信息
     * @param {*} result 回调的结果
     */
    async Done(err, result) {
        try {
            if (this.callback) await this.runInAsyncScope(this.callback, null, result, err);
        } catch (newerr) {
            em.emit("Debug.Log", `线程退出后执行回调出错：${newerr.message}`, "WORKERPOOL", Serialize.Error(newerr));
            throw newerr;
        } finally {
            this.emitDestroy();  // `TaskInfo`s are used only once.
        }
    }
}