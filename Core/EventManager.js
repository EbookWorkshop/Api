const { EventEmitter } = require('events');

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
}

module.exports = EventManager;