const Index = require("./../Ebook/Index.js");

/**
 * 章节目录——网文版，多了WebTitle，用于合并不同源的章节合并
 */
class WebIndex extends Index {
    constructor({ WebTitle, ...x }) {
        super(x);
        /**
         * 网站上显示的章节名，不要修改，合并章节时用于识别是不是同一章
         * 整理后显示的章节名是 Title
         */
        this.WebTitle = WebTitle;

        /**
         * 章节页地址，多来源
         */
        this.URL = [];//TODO:该用什么方式管理多来源
    }
}

module.exports = WebIndex;