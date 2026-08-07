import Chapter from "../Ebook/Chapter.js";

/**
 * 章节
 */
export default class WebChapter extends Chapter {
    constructor({ WebTitle, ...x }) {
        super(x);

        /**
         * 网站上显示的章节名，不要修改，合并章节时用于识别是不是同一章
         * 整理后显示的章节名是 Title
         */
        this.WebTitle = WebTitle;
    }
}