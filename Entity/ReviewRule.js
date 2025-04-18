/**
 * 校阅规则
 */
class ReviewRule {
    constructor({ Name, Rule, Replace } = {}) {
        this.Name = Name;       //配置名称
        this.Rule = Rule;       //查找规则、查找串
        this.Replace = Replace;    //真实的值类型
    }
}


module.exports = ReviewRule;