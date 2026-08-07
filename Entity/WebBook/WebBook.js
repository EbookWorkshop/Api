import Ebook from "../Ebook/Ebook.js";

/**
 * 网页上扒的书
 */
export default class WebBook extends Ebook {
    /**
     * 网文电子书
     */
    constructor({ WebBookId = -1, WebBookName, defaultIndex, AutoSyncEnabled, isCheckRepeat, ...x } = {}) {
        if (x.BookId) x.id = x.BookId;
        super(x);

        /**
         * 网文在WebBook表中对应的记录ID
         */
        this.WebBookId = WebBookId;

        this.IndexUrl = [];     //可供爬书的目录页-数组，用于支持多网站来源
        /**
         * 当前在用的目录页序号（多站来源）
         */
        this.defaultIndex = defaultIndex || 0;

        /**
         * 网站上的书名，可能会有奇怪的不方便删除的字符，
         * 用于对照书本身份的名字，抓取记录后不应修改。
         * 如需修改、优化或整理，显示的书名使用 BookName
         */
        this.WebBookName = WebBookName;

        /**
         * 是否自动获取内容
         */
        this.AutoSyncEnabled = AutoSyncEnabled || true;

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
    AddIndexUrl(url) { console.warn("WebBook::AddIndexUrl 尚未初始化，未有实现。", this); console.trace(); return 0; }
    /**
     * 从数据库加载所有目录信息 初始化Index数组
     */
    ReloadIndex() { console.warn("WebBook::ReloadIndex 尚未初始化，未有实现。", this); console.trace(); return 0; }
    /**
     * 通过目录ID，加载指定章节到当前对象
     * @param {int} cId 章节ID
     */
    ReloadChapter(cId) { console.warn("WebBook::ReloadChapter 尚未初始化，未有实现。", this); console.trace(); return 0; }
    /**
     * 根据目录ID，返回指定的目录对象
     * @param {int} cId 目录ID
     * @returns WebIndex 
     */
    GetIndex(cId) { console.warn("WebBook::GetIndex 尚未初始化，未有实现。", this); console.trace(); return 0; }
    /**
     * 根据目录ID，返回指定的章节对象
     * @param {int} cId 目录ID
     * @returns WebIndex 
     */
    GetChapter(cId) { console.warn("WebBook::GetChapter 尚未初始化，未有实现。", this); console.trace(); return 0; }

    /**
     * 拿到章节的最大序号
     * @returns 当前最大的排序序号
     */
    GetMaxIndexOrder() { console.warn("WebBook::GetMaxIndexOrder 尚未初始化，未有实现。"); console.trace(); return 0; }
}
