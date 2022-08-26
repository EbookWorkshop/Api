let Ebook = require("../Ebook/Ebook");

class PDFBook extends Ebook {
    constructor({ ...x }) {
        super(x);

        /**
         * 左右页边距
         */
        this.paddingX = 10;
        /**
         * 上下页边距
         */
        this.paddingY = 10;

        /**
         * 页面宽度
         */
        this.pageWidth = 580;   //px

        /**
         * 制作范围：选定范围内的章节制作成书
         */
        this.showIndexId = new Set();
    }
}

module.exports = PDFBook;