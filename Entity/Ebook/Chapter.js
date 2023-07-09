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
}

module.exports = Chapter;