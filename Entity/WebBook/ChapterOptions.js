let Rule = require("../WebBook/Rule");

class ChapterOptions {
    /**
     * 创建爬章节的规则
     */
    constructor() {
        /**
         * 章节名称规则
         */
        this.CapterTitleRule = new Rule("CapterTitle");

        /**
         * 书的内容规则
         */
        this.ContentRule = new Rule("Content")

        /**
         * 爬下一页的规则
         */
        this.NextPageRule = new Rule("ContentNextPage");
    }

    GetRuleList() {
        return [
            this.CapterTitleRule,
            this.ContentRule,
            this.NextPageRule,
        ];
    }
}
module.exports = ChapterOptions;