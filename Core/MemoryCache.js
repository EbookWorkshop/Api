class MemoryCache {
    constructor() {
        this._cache = new Map();
        const DEF_TTL_MS = 30 * 60 * 1000;
    }

    /**
     * 设置缓存值
     * @param {string} key 缓存键
     * @param {object} value 缓存值
     * @param {number} ttlMs 过期时间（毫秒）
     */
    set(key, value, ttlMs = -1) {
        this._cache.set(key, value);
        setTimeout(() => this.delete(key), ttlMs || DEF_TTL_MS);
    }

    get(key) {
        return this._cache.get(key);
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
