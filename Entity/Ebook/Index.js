
class Index {
    constructor({ Title, OrderNum, IndexId = 0, id }) {
        /**
         * 章节标题
         */
        this.Title = Title;

        this.OrderNum = OrderNum;

        this.IndexId = IndexId || id;
    }
}

module.exports = Index;