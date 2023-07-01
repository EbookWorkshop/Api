let IndexOptions = require("./IndexOptions");
let ChapterOptions = require("./ChapterOptions");

let Ebook = require("../Ebook/Ebook");

/**
 * 网页上扒的书
 */
class WebBook extends Ebook {
    /**
     * 网文电子书
     */
    constructor({ WebBookName, defaultIndex, isCheckEnd, isCheckRepeat, ...x } = {}) {
        if (x.BookId) x.id = x.BookId;
        super(x);

        this.IndexUrl = [];     //可供爬书的目录页-数组，用于支持多网站来源
        /**
         * 当前在用的目录页序号（多站来源）
         */
        this.defaultIndex = defaultIndex || 0;

        /**
         * 网站上的书名，可能会有奇怪的不方便删除的字符
         * 优化整理后显示的书名使用 BookName
         */
        this.WebBookName = WebBookName;

        /**
         * 是否检查文章正常结束
         */
        this.isCheckEnd = isCheckEnd || true;

        /**
         * 是否检查章节重复
         */
        this.isCheckRepeat = isCheckRepeat || true;

        /**
         * 临时，仅用于合并章节时，用于记录临时的章节情况
         */
        this.tempMergeIndex = null; //Map
    }

    /**
     * 添加来源地址
     * @param {string} url 
     */
    AddIndexUrl(url) { console.warn("WebBook::AddIndexUrl 尚未初始化，未有实现。") }
    /**
     * 从数据库加载所有目录信息 初始化Index数组
     */
    ReloadIndex() { console.warn("WebBook::ReloadIndex 尚未初始化，未有实现。") }
    /**
     * 通过目录ID，加载指定章节到当前对象
     * @param {int} cId 章节ID
     */
    ReloadChapter(cId) { console.warn("WebBook::ReloadChapter 尚未初始化，未有实现。") }
    /**
     * 根据目录ID，返回指定的目录对象
     * @param {int} cId 目录ID
     * @returns WebIndex 
     */
    GetIndex(cId) { console.warn("WebBook::GetIndex 尚未初始化，未有实现。") }
    /**
     * 根据目录ID，返回指定的章节对象
     * @param {int} cId 目录ID
     * @returns WebIndex 
     */
    GetChapter(cId) { console.warn("WebBook::GetChapter 尚未初始化，未有实现。") }

    /**
     * 拿到章节的最大序号
     * @returns 当前最大的排序序号
     */
    GetMaxIndexOrder() { console.warn("WebBook::GetChapter 尚未初始化，未有实现。") }
}

module.exports = WebBook;