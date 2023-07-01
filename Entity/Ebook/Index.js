
class Index {
    constructor({ Title, OrderNum, IndexId = 0, id, HasContent }) {
        /**
         * 章节标题
         */
        this.Title = Title?.trim();

        this.OrderNum = OrderNum;

        this.IndexId = IndexId || id;

        /**
         * 是否已爬取/记录了文章内容
         */
        this.IsHasContent = HasContent || false;
    }
}

module.exports = Index;