let Rule = require("../WebBook/Rule");

class IndexOptions {
    /**
     * 创建爬目录的规则配置
     */
    constructor() {
        /**
         * 爬书名的规则
         */
        this.BookNameRule = new Rule("BookName");

        /**
         * 爬章节列表的规则
         */
        this.ChapterListRule = new Rule("ChapterList", "List");

        /**
         * 爬下一页目录的规则
         */
        this.NextPageRule = new Rule("IndexNextPage");

        /**
         * 爬封面的规则
         */
        this.BookCoverRule = new Rule("BookCover");

        /**
         * 爬简介的规则
         */
        this.IntroductionRule = new Rule("Introduction");

        /**
         * 爬作者的规则
         */
        this.AuthorRule = new Rule("Author");
    }

    /**
     * 取得规则列表
     */
    GetRuleList() {
        return [
            this.BookNameRule,
            this.ChapterListRule,
            this.NextPageRule,
            this.BookCoverRule,
            this.IntroductionRule,
            this.AuthorRule
        ];
    }
}

module.exports = IndexOptions;