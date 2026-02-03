class Index {
    constructor({ Title, OrderNum, IndexId = 0, id, HasContent, VolumeId = null }) {
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
        
        /**
         * 所属卷ID，为null表示直接属于书籍
         */
        this.VolumeId = VolumeId || null;
    }
}

module.exports = Index;