/**
 * 爬站规则-内容提取规则
 */
class Rule {
    /**
     * 创建提取规则（通过配置querySelector，设定需要提取的内容）
     * @param {*} ruleName 规则名称
     * @param {*} type 期望结果类型：Object-单个对象；List-列表结果
     */
    constructor(ruleName, type = "Object") {
        /**
         * 当前规则名
         */
        this.RuleName = ruleName;

        /**
         * 选择器（css选择器）
         */
        this.Selector = "";
        /**
         * 获取文本的方法
         */
        this.GetContentAction = "";
        /**
         * 获取地址的方法
         */
        this.GetUrlAction = "";

        /**
         * 爬取的结果集格式，Object-单个对象；List-列表结果
         */
        this.Type = type;

        /**
         * 需要删除的元素列表（去广告、去干扰等）
         */
        this.RemoveSelector = [];

        /**
         * 当前规则用于进一步校验的配置
         * （比如部分网站，【下一页】和【下一章】由相同的选择器命中，这就需要进一步的确认是否正确）
         */
        this.CheckSetting = null;
    }
}

class Action {
    constructor() {
        /**
        方案1： 格式字符串
            前缀/方式[/参数]
            如： 
                attr/innerText  读取属性 innerText
                fun/onclick     执行onclick属性
                reg/match/Regexp    匹配正则表达式

        方案2： 类对象配置
            this.type = "attr";
            this.action = "innerHTML";
            this.param = "";
         */
    }
}


module.exports = Rule;