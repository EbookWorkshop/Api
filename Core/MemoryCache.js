const DEF_TTL_MS = 30 * 60 * 1000;
class MemoryCache {
    constructor() {
        this._cache = new Map();
    }

    /**
     * 设置缓存值
     * @param {number} key 缓存键
     * @param {object} value 缓存值
     * @param {number} ttlMs 过期时间（毫秒）
     */
    set(key, value, ttlMs = null) {
        if (typeof key !== "number") throw new Error("缓存键必须为数字");

        this._cache.set(key, value);
        // setTimeout(() => this.delete(key), ttlMs || DEF_TTL_MS);
        console.log(`设置缓存 ${key} 过期时间 ${ttlMs || DEF_TTL_MS}ms`);
    }

    get(key) {
        if (key * 1 !== key) throw new Error("缓存键必须为数字");
        return this._cache.get(key * 1);
    }

    delete(key) {
        return this._cache.delete(key);
    }

    has(key) {
        return this._cache.has(key);
    }

    clear() {
        this._cache.clear();
    }
}

// 单例模式
let _instance = null;
module.exports = {
    getInstance: () => {
        if (!_instance) _instance = new MemoryCache();
        return _instance;
    }
};
