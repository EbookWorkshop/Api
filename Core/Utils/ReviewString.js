
/**
 * 替换的执行规则
 *     如果自动校阅功能出问题了，需要检修这里
 * @param {ReviewRule[]} rules 
 * @param {String[]} sourceText 
 * @returns 
 */
function Run(rules, sourceText) {
    let result = Array.from(sourceText);
    // console.log(result);
    for (let r of rules) {
        let tempArray = [];
        let rTarget = r.Replace;
        if (rTarget.includes("\\")) {//MARK: 被替换字符如含转义符，需要先一步解释，需要这里先进行替换
            rTarget = rTarget.replace(/\\n/g, '\n');
        }

        for (let t of result) {
            tempArray.push(t?.replace(new RegExp(r.Rule, "gm"), rTarget))
        }
        result = Array.from(tempArray);
    }
    return result;
}

/**
 * 测试规则
 * @param { ReviewRule } rule 需测试的规则
 * @param { string } testText 测试用的文本
 */
function Test(rule, testText) {
    if (!rule || !testText) return { match: false, source: testText, result: null };
    let testRegExp = new RegExp(rule.Rule, "gm");

    let rTarget = rule.Replace;
    if (rTarget.includes("\\")) {//MARK: 被替换字符如含转义符，需要先一步解释，需要这里先进行替换
        rTarget = rTarget.replace(/\\n/g, '\n');
    }
    let match = testText.match(testRegExp);
    let result = testText.replace(testRegExp, rTarget);

    return {
        match,
        source: testText,
        result
    }
}

module.exports = {
    Run,
    Test
}