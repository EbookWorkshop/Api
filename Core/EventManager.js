const { EventEmitter } = require('events');
const Message = require("../Entity/Message");

let myEventManager = null;


/**
 * 全局的事件管理器    
 * **注意：相同的事件监听器超过10个可能会导致事件丢失或性能问题**
 */
class EventManager extends EventEmitter {
    constructor() {
        if (myEventManager != null) return myEventManager;
        super();
        myEventManager = this;
    }


    /**
     * 向前端发一个后台消息
     * @param {Message} message 
     */
    SendMessageToUI(message, data, error) {
        myEventManager.emit("MessageToUI", message, data, error);
    }

    /**
     * 向后台发送一个错误类型的消息
     * @param {*} message 
     * @param {*} data 
     * @param {*} error 
     */
    SendErrorToUI(message, data, error) {
        myEventManager.emit("MessageToUI", message, data, error, true);
    }
}

module.exports = EventManager;