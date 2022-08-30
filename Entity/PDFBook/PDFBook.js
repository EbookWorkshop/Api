let Ebook = require("../Ebook/Ebook");

class PDFBook extends Ebook {
    constructor({ PaddingX, PaddingY, PageWidth, IsShowTitleOnChapter, ...x }) {
        super(x);

        /**
         * 左右页边距
         */
        this.paddingX = PaddingX || 10;
        /**
         * 上下页边距
         */
        this.paddingY = PaddingY || 10;

        /**
         * 页面宽度
         */
        this.pageWidth = PageWidth || 580;   //px

        /**
         * 制作范围：选定范围内的章节制作成书
         */
        this.showIndexId = new Set();

        /**
         * 制作成pdf时 是否在每一章的头部加入章节标题
         * 不加：适合章节分割不明显的书无缝阅读
         * 加入：适合每章中心、重点不同的书，根据标题紧跟剧情走向
         */
        this.isShowTitleOnChapter = IsShowTitleOnChapter || false;
    }
}

module.exports = PDFBook;