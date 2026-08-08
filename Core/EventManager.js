import { EventEmitter } from 'node:events';
import Serialize from './Utils/Serialize.js';
import Message from "../Entity/Message.js";

import { isMainThread } from 'node:worker_threads';
import { WhoCallMe } from './Worker/AsyncStorage.js';




let myEventManager = null;


/**
 * 全局的事件管理器    
 * **注意：相同的事件监听器超过10个可能会导致事件丢失或性能问题**
 */
export default class EventManager extends EventEmitter {
    constructor() {
        if (myEventManager != null) return myEventManager;
        super();
        myEventManager = this;

        if (!isMainThread) {
            // TODO：可以尝试将截获到的消息，通过子线程用线程间通讯转发到主线程，再由主线程通过消息模块转发出去
            console.warn("!!!注意!!! 检测到子线程引用了单例模块。子线程使用独立的单例，与主线程的消息模块并不互通。");
            console.trace();
            import("./Worker/AsyncStorage.js").then(({ WhoCallMe }) => {
                console.warn("引入模块：", WhoCallMe());
            })
        }
    }

    /**
     * 发送消息
     * @param {string} event 消息名
     * @param  {...any} args 附带参数
     */
    emit(event, ...args) {
        if (!isMainThread) {        //在子线程中发信息
            console.info("尝试在子线程中发消息：\n", event, ...args);
            console.warn("!!!注意!!!尝试在子线程中使用消息模块！子线程使用独立的单例，与主线程的消息模块并不互通。");
            console.trace();
            return false;
        }
        return super.emit(event, ...args);
    }


    /**
     * 向前端发一个后台消息
     * @param {Message} message 
     */
    SendMessageToUI(message, data, error) {
        this.emit("MessageToUI", message, Serialize.Result(data), Serialize.Error(error));
    }

    /**
     * 向后台发送一个错误类型的消息
     * @param {*} message 
     * @param {*} data 
     * @param {*} error 
     */
    SendErrorToUI(message, data, error) {
        this.emit("MessageToUI", message, Serialize.Result(data), Serialize.Error(error), true);
    }
}

export { EventManager };