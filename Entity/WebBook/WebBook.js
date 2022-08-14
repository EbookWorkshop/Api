let IndexOptions = require("./IndexOptions");
let ChapterOptions = require("./ChapterOptions");

let Ebook = require("../Ebook/Ebook");

class WebBook extends Ebook {
    /**
     * 网文电子书
     */
    constructor() {
        super();

        this.IndexUrl = [];     //可供爬书的目录页-数组，用于支持多网站来源
        /**
         * 当前在用的目录页序号（多站来源）
         */
        this.defaultIndex = 0;

        /**
         * 网站上的书名，可能会有奇怪的不方便删除的字符
         * 优化整理后显示的书名使用 BookName
         */
        this.WebBookName = "";

        /**
         * 是否检查文章正常结束
         */
        this.isCheckEnd = true;

        /**
         * 是否检查章节重复
         */
        this.isCheckRepeat = true;
    }
}

module.exports = WebBook;