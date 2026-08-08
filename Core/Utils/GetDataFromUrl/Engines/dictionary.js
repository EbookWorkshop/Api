/**
 * 解释规则，将当前页面的内容按配置的字典解释为提取内容
 * @param {*} page 已打开的网页
 * @param {ReviewDictionary} dict 提取内容字典配置
 * @param {string} text 原始正文
 * @returns {string} 解释后结果
 */
export async function ExecDict(page, dict, text) {
    if (!dict) return text;

    //判断执行条件是否命中
    if (dict.isExecute === false || !await isExec(page, dict)) return text;
    return UseDictReplace(dict.Data, text);
}

/**
 * 判断是否需要执行
 * @param {*} page 当前网页
 * @param {ReviewDictionary} dict 字典
 */
export async function isExec(page, dict) {
    try {
        switch (dict.ExecuteType) {
            case "Selector":        //当页面存在某些指定的元素时，才启用转换
                return await page.$$eval.call(page, dict.Execute, (node) => { return node.length > 0; });
                break;
            case "Boolean":         //可以看作是【启用/停用】的开关模式
                return parseBoolean(dict.Execute);
                break;
            //TODO: 开发其它命中模式
        }
    } catch (err) {
        return false;
    }
}

/**
 * 用字典翻译文本
 * @param {string} dictData 字典
 * @param {string} text 待替换原文本
 */
export function UseDictReplace(dictData, text) {
    if (!text) { return text; }//throw new Error("UseDictReplace：：转换失败，待转换文本为空！");
    let ddMap = new Map();
    let rows = dictData.split("\n");

    for (let r of rows) {
        let s = r.trim().split(/\s+/);
        if (s.length != 2) continue;
        let [key, value] = s;
        if (key.startsWith("\\u")) {
            key = String.fromCharCode(parseInt(key.slice(2), 16));
        }
        ddMap.set(key, value);
    }

    let result = text;
    for (let k of ddMap.keys()) {
        result = result.replaceAll(k, ddMap.get(k));
    }
    return result;
}

function parseBoolean(value, defaultValue = false) {
    if (typeof value === 'boolean') return value;
    const str = String(value).toLowerCase().trim();
    if (str === 'true' || str === '1') return true;
    if (str === 'false' || str === '0') return false;
    return defaultValue; // 默认返回 false
}
