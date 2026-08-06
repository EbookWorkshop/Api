import { isNativeError } from 'node:util/types';

/**
 * 将 Error 对象序列化为可安全传输的普通对象
 * Error 对象的 name、message、stack 等属性是不可枚举的，统一处理
 * @param {Error} err - 可能是 Error 实例、字符串或其他值
 * @returns {object} 可序列化的普通对象
 */
export function Error(err) {
    if (!isNativeError(err)) {//node 方法，判断是否原生错误类型
        return err;
    }

    // 构建基础对象，包含关键非枚举属性
    const serialized = {
        name: err.name || 'Error',
        message: err.message || '',
        stack: err.stack || '',
    };

    // 复制所有可枚举的自定义属性
    for (const key of Object.keys(err)) {
        // 跳过已经处理过的属性（防止重复）
        if (key === 'name' || key === 'message' || key === 'stack') {
            continue;
        }
        serialized[key] = err[key];
    }

    // 处理嵌套的 cause（Node 16+ 支持）
    if (err.cause !== undefined) {
        // 递归处理 cause，可能也是 Error 实例
        serialized.cause = SerializeError(err.cause);
    }

    return serialized;
}

/**
 * 用于排除不可克隆内容
 * @param {*} data 
 * @returns {object} 可序列化的普通对象
 */
export function Result(data) {
    try {
        return structuredClone(data);
    } catch {
        // 降级方案：尝试 JSON 序列化
        return JSON.parse(JSON.stringify(data));
    }
}


export default { Error, Result };
