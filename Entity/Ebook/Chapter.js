/**
 * 章节
 */
class Chapter {
    constructor() {
        this.Title = "";
        /**
         * 当前章节文章内容
         */
        this.Content = "";
        /**
         * 排序号
         */
        this.OrderNo = 0;
        this.Id = "";
    }
}

module.exports = Chapter;