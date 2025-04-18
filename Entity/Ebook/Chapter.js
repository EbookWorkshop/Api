/**
 * 章节
 */
class Chapter {
    constructor({ Title, Content, IndexId, id, OrderNum }) {
        this.Title = Title?.trim();
        /**
         * 当前章节文章内容
         */
        this.Content = Content;

        this.IndexId = IndexId || id;

        this.OrderNum = OrderNum
    }

    /**
     * 简介 的章节名
     * 该章节名是系统生成的，不能修改
     */
    static get IntroductionName() {
        return `Sys_Introduction_Chapter`;
    }

}

module.exports = Chapter;