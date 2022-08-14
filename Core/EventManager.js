const { EventEmitter } = require('events');

let myEventManager = null;


/**
 * 全局的事件管理器
 */
class EventManager extends EventEmitter {
    constructor() {
        if (myEventManager != null) return myEventManager;
        super();
        myEventManager = this;
    }
}

module.exports = EventManager;