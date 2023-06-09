const Models = require("./Models");
const Ebook = require("../../Entity/Ebook/Ebook");
const Index = require("../../Entity/Ebook/Index");
const Chapter = require("../../Entity/Ebook/Chapter");
const WebBook = require("../../Entity/WebBook/WebBook");
const WebIndex = require("../../Entity/WebBook/WebIndex");
const WebChapter = require("../../Entity/WebBook/WebChapter");

const PDFBook = require("./../../Entity/PDFBook/PDFBook");

/**
 * doToPo
 */
class DO {
    constructor() { }

    /**
     * 
     * @param {*} ebookModel 
     * @param {*} BOOKTYPE 需要创建的类，如`Ebook`、`WebBook`、`PDFBook`
     * @returns 
     */
    static async ModelToBookObj(ebookModel, BOOKTYPE) {
        // const myModels = new Models();
        let ebook = new BOOKTYPE({ ...ebookModel.dataValues });

        /**
         * 重新加载所有章节
         */
        ebook.ReloadIndex = async () => {
            const myModels = new Models();
            let eIndexs = await myModels.EbookIndex.findAll({ where: { BookId: ebook.BookId }, order: ["OrderNum"] });
            for (let i of eIndexs) {
                let index = new Index({ ...i.dataValues, HasContent: i.HasContent })
                ebook.Index.push(index);
            }
        }

        /**
         * 从数据库加载指定章节到当前对象
         * @param {*} cId 章节ID
         */
        ebook.ReloadChapter = async (cId) => {
            let ebookIndex = await new Models().EbookIndex.findOne({ where: { id: cId, BookId: ebook.BookId } });
            if (ebookIndex == null) return;
            let cp = new Chapter({ ...ebookIndex.dataValues });
            // if (cp.Content) 
            ebook.Chapters.set(cp.Title, cp);
        }

        /**
         * 拿到指定章节内容
         * @param {*} cId 章节ID
         */
        ebook.GetChapter = (cId) => {
            let iObj = ebook.Index.filter(i => i.IndexId === cId);
            if (iObj.length <= 0) return null;
            return ebook.Chapters.get(iObj[0].Title);
        }

        /**
         * 设置并存储
         * @param {*} path 
         */
        ebook.SetCoverImg = async (path) => {
            ebookModel.CoverImg = path;
            await ebookModel.save();
        }

        ebook.InitReviewRules = async () => {
            if (ebook.ReviewRules != null) return;
            ebook.ReviewRules = [];
            let reviewRules = await ebookModel.getReviewRuleUsings();

            for (let rule of reviewRules) {
                let rr = await rule.getReviewRule();
                if (rr) ebook.ReviewRules.push({
                    Rule: rr.Rule,
                    Replace: rr.Replace
                });
            }
        }

        /**
         * 校正指定章节
         * @param {*} cId 
         * @returns 
         */
        ebook.ReviewChapter = async (cId) => {
            let iObj = ebook.Index.filter(i => i.IndexId === cId);
            if (iObj.length <= 0) return null;
            if (ebook.ReviewRules == null) await ebook.InitReviewRules();

            let curContent = ebook.Chapters.get(iObj[0].Title);
            for (let r of ebook.ReviewRules) {
                let rTarget = r.Replace;
                if (rTarget.includes("\\")) {//MARK: 被替换字符如含转义符，需要先一步解释，需要这里先进行替换
                    rTarget = rTarget.replace(/\\n/g, '\n');
                }
                curContent.Content = curContent.Content.replace(new RegExp(r.Rule, "g"), rTarget);
            }
            ebook.Chapters.set(iObj[0].Title, curContent);
        }

        await ebook.ReloadIndex();
        return ebook;
    }

    /**
     * 根据ID获得对应的EBook对象
     * @param {*} bookId 
     * @returns Ebook
     */
    static async GetEBookById(bookId) {
        const myModels = new Models();
        let book = await myModels.Ebook.findOne({ where: { id: bookId } });
        if (book == null) return null;
        return await DO.ModelToEBook(book);
    }

    /**
     * 根据ID获得对应的 章节对象
     * @param {*} chapterId 章节ID
     * @returns 章节
     */
    static async GetEBookChapterById(chapterId) {
        const myModels = new Models();
        let chapter = await myModels.EbookIndex.findOne({ where: { id: chapterId } });
        if (chapter == null) return null;
        return { ...chapter.dataValues };
    }

    /**
     * 传输对象转换为EBook对象
     * @param {*} ebookModel 
     * @returns EBook
     */
    static async ModelToEBook(ebookModel) {
        return await DO.ModelToBookObj(ebookModel, Ebook);
    }

    /**
     * 根据ID获得对应的WebBook对象
     * @param {int} bookId 书的ID
     */
    static async GetWebBookById(bookId) {
        const myModels = new Models();
        let book = await myModels.WebBook.findOne({
            where: { BookId: bookId }
        });

        if (book == null) return null;

        return await DO.ModelToWebBook(book);
    }

    /**
     * 根据书名找到对应的电子书配置
     * @param {string} bookName 书名/网文的唯一书名
     * @returns WebBook
     */
    static async GetOrCreateWebBookByName(bookName) {
        const myModels = new Models();
        bookName = bookName?.trim();
        if (!bookName) return;
        let [book, created] = await myModels.WebBook.findOrCreate({
            where: { WebBookName: bookName }
        });

        if (created) {
            //新创建的话也创建EBook档案，并用EBook 的ID更新WebBook
            let [ebook, ecreated] = await myModels.Ebook.findOrCreate({
                where: { BookName: bookName }
            });

            if (ecreated) {
                book.update({ BookId: ebook.id }, { where: { WebBookName: bookName } });
            }
        }

        return await DO.ModelToWebBook(book);
    }

    /**
     * 数据库对象传输为WebBook对象-OK
     * @param {Model} webModel 数据库模型 
     * @returns WebBook 对象
     */
    static async ModelToWebBook(webModel) {
        let ebook = await webModel?.getEbook();
        let ebookObj = await DO.ModelToBookObj(ebook, Ebook);
        let webBook = new WebBook({ ...webModel.dataValues, ...ebook.dataValues });
        let urls = await webModel.getWebBookIndexSourceURLs();
        for (var u of urls) webBook.IndexUrl.push(u.Path);

        webBook.SetCoverImg = async (path) => { return await ebookObj.SetCoverImg(path); }

        /**
         * 添加来源地址
         * @param {*} url 
         */
        webBook.AddIndexUrl = async (url, isSetDefault = false) => {
            if (!webBook.IndexUrl.includes(url)) {
                webBook.IndexUrl.push(url);
                if (isSetDefault) {
                    webBook.defaultIndex = webBook.IndexUrl.length - 1;
                    webModel.defaultIndex = webBook.defaultIndex;
                    //将这项配置也更新到数据库
                    await webModel.save();
                }
                let ret = await new Models().WebBookIndexSourceURL.create({
                    Path: url,
                    WebBookId: webBook.BookId
                });
                return ret;
            }
        }

        /**
         * 从数据库加载所有目录信息 初始化Index数组
         */
        webBook.ReloadIndex = async () => {
            const myModels = new Models();
            let eIndexs = await myModels.EbookIndex.findAll({ where: { BookId: webBook.BookId }, order: ["OrderNum"] });
            for (let i of eIndexs) {
                let eI = await i.getWebBookIndex();

                let tIdx = new WebIndex({ ...i.dataValues, ...eI?.dataValues });
                let urls = await eI?.getWebBookIndexURLs() || [];
                for (let u of urls) tIdx.URL.push(u.Path);

                webBook.Index.push(tIdx);
            }
        }

        /**
         * 拿到章节的最大序号
         * @returns 当前最大的排序序号
         */
        webBook.GetMaxIndexOrder = async () => {
            const myModels = new Models();
            let lastIndex = await myModels.EbookIndex.findOne({ where: { BookId: webBook.BookId }, order: [["OrderNum", "DESC"]] });
            return lastIndex.OrderNum;
        }

        /**
         * 从数据库加载指定章节
         * @param {*} cId 章节ID
         */
        webBook.ReloadChapter = async (cId) => {
            let ebookIndex = await new Models().EbookIndex.findOne({ where: { id: cId, BookId: webBook.BookId } });
            if (ebookIndex == null) return;
            let wbookIndex = await ebookIndex.getWebBookIndex();
            let cp = new WebChapter({ ...wbookIndex.dataValues, ...ebookIndex.dataValues });
            if (cp.Content) webBook.Chapters.set(cp.WebTitle, cp);
        }

        /**
         * 返回指定ID的章节配置——在对象内查找
         * @param {*} cId 章节ID
         * @returns WebIndex
         */
        webBook.GetIndex = (cId) => {
            let tempIdx = webBook.Index.filter(i => i.IndexId === cId);
            if (tempIdx.length === 0) return null;

            return new WebIndex({ ...tempIdx[0] });
        }

        /**
         * 根据目录ID找到对应章节
         * @param {*} cId 目录ID
         * @returns WebChapter
         */
        webBook.GetChapter = (cId) => {
            let tempIdx = webBook.GetIndex(cId);
            if (tempIdx == null) return null;

            if (webBook.Chapters.has(tempIdx.WebTitle)) {
                return webBook.Chapters.get(tempCP.WebTitle);
            }

            let tempCP = new WebChapter({ ...tempIdx });
            return tempCP;
        }


        /**
         * 合并目录章节
         * 拿到章节名，查找是否已经添加，是则跳过，否则插入一个新记录
         * @param {*} param0 
         * @param {*} orderNum 
         */
        webBook.MergeIndex = async ({ title, url }, orderNum) => {
            if (webBook.tempMergeIndex.has(title)) {    //发现重复章节，需要合并
                webBook.tempMergeIndex.get(title).urls.push(url);
                return;
            }
            webBook.tempMergeIndex.set(title, { urls: [url] });

            const myModels = new Models();
            let wbIndex = await myModels.WebBookIndex.findOne({
                where: { WebTitle: title },
                include: {
                    model: myModels.EbookIndex,
                    as: "EbookIndex",
                    where: { BookId: webBook.BookId }
                },
            });

            if (wbIndex == null) {  //目录不存在章节时，添加新章节
                let ret = await myModels.EbookIndex.create({ Title: title, BookId: webBook.BookId, OrderNum: orderNum });
                wbIndex = await myModels.WebBookIndex.create({ WebTitle: title, IndexId: ret.id });
            }

            let urls = await wbIndex.getWebBookIndexURLs();
            let cUrl = [];      //当前章节数据库已存地址展开结果
            for (let u of urls) {
                cUrl.push(u.Path);
            }
            for (let url of webBook.tempMergeIndex.get(title).urls) {
                if (!cUrl.includes(url)) {
                    let ret = await myModels.WebBookIndexURL.create({ Path: url, WebBookIndexId: wbIndex.id });
                    cUrl.push(url);
                }
            }

            let tIdx = new WebIndex({ WebTitle: title, Title: title, OrderNum: orderNum, IndexId: wbIndex.IndexId });
            tIdx.URL.push(...cUrl);

            webBook.Index.push(tIdx);
        }



        /**
         * 更新章节内容
         * @param {WebChapter} chapter 章节对象
         * @param {*} isupdate 是否覆盖更新（原有内容将覆盖
         */
        webBook.AddChapter = async (chapter, isupdate = false) => {
            const myModels = new Models();

            if (webBook.Chapters.has(chapter.WebTitle) && !isupdate) return;        //已有并不更新时直接退出

            myModels.EbookIndex.update({ Content: chapter.Content }, { where: { id: chapter.IndexId } });
            webBook.Chapters.set(chapter.WebTitle, chapter);
        }

        await webBook.ReloadIndex();
        return webBook;
    }

    /**
     * 删除指定书的ID
     * @param {*} bookId 书ID
     */
    static async DeleteOneBook(bookId) {
        const myModels = new Models();

        const ebook = await myModels.Ebook.findOne({ where: { id: bookId } });
        if (ebook == null) return;


        const index = await ebook.getEbookIndex();

        const wbook = await ebook.getWebBook();
        const wbSourceUrl = await wbook.getWebBookIndexSourceURLs();
        for (let i of index) {
            const eIndex = await i.getWebBookIndex();
            if (eIndex === null) continue;
            const eIUrl = await eIndex.getWebBookIndexURLs();
            for (let ei of eIUrl) {
                await ei.destroy();
            }
            await eIndex.destroy();
            await i.destroy();
        }
        for (let wu of wbSourceUrl) {
            await wu.destroy();
        }
        await wbook.destroy();
        await ebook.destroy();
    }

    /**
     * 创建一个PDF对象
     * @param {int} bookId 书的ID
     */
    static async GetPDFById(bookId) {
        const myModels = new Models();
        let book = await myModels.Ebook.findOne({ where: { id: bookId } });
        if (book == null) return null;

        let pdf = await DO.ModelToBookObj(book, PDFBook);

        /**
         * 设置包含的章节
         * @param {Array} chapters 需要的章节Id
         */
        pdf.SetShowChapters = async (chapters) => {
            for (let c of chapters) {
                if (pdf.showIndexId.has(c)) continue;
                await pdf.ReloadChapter(c);
                pdf.showIndexId.add(c);
            }
        }

        return pdf;
    }


    /**
     * 获取图书列表
     */
    static async GetBookList() {
        const myModels = new Models();
        let bookListModels = await myModels.Ebook.findAll({ order: [["id", "DESC"]] });
        let bookList = [];
        for (let b of bookListModels) {
            bookList.push(new Ebook({ ...b.dataValues }));
        }
        return bookList;
    }
}

module.exports = DO;