
/**
 * 替换的执行规则
 *     如果自动校阅功能出问题了，需要检修这里
 * @param {Rule[]} rules 
 * @param {String[]} sourceText 
 * @returns 
 */
module.exports = (rules, sourceText) => {
    let result = Array.from(sourceText);
    for (let r of rules) {
        let tempArray = [];
        let rTarget = r.Replace;
        if (rTarget.includes("\\")) {//MARK: 被替换字符如含转义符，需要先一步解释，需要这里先进行替换
            rTarget = rTarget.replace(/\\n/g, '\n');
        }
        for (let t of result) {
            tempArray.push(t.replace(new RegExp(r.Rule, "g"), rTarget))
        }
        result = Array.from(tempArray);
    }
    return result;
}