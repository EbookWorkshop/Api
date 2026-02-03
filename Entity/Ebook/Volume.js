/**
 * 卷
 */
class Volume {
    constructor({ id, VolumeId, BookId, Title, Introduction, OrderNum }) {
        this.VolumeId = VolumeId || id;
        this.BookId = BookId;
        /**
         * 卷标题
         */
        this.Title = Title?.trim();
        /**
         * 卷简介
         */
        this.Introduction = Introduction || '';
        /**
         * 卷排序号
         */
        this.OrderNum = OrderNum;
    }
}

module.exports = Volume;
