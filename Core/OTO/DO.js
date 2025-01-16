const Models = require("./Models");
const Reviewer = require("./../Utils/RuleReview");
const Ebook = require("../../Entity/Ebook/Ebook");
const Index = require("../../Entity/Ebook/Index");
const Chapter = require("../../Entity/Ebook/Chapter");
const WebBook = require("../../Entity/WebBook/WebBook");
const WebIndex = require("../../Entity/WebBook/WebIndex");
const WebChapter = require("../../Entity/WebBook/WebChapter");

const PDFBook = require("./../../Entity/PDFBook/PDFBook");

//数据库操作文档 https://www.sequelize.cn/

/**
 * # PoToDo、DoToPo
 * 将实体类和数据库类互转
 */
class DO {
    constructor() { }

    /**
     * # Po to Do
     * @param {*} ebookModel PO
     * @param {Ebook|WebBook|PDFBook} BOOKTYPE 需要创建的类，如`Ebook`、`WebBook`、`PDFBook`
     * @returns {BOOKTYPE} 
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
            // await ebook.ReviewChapter(cId);     //加载每一章后自动校阅      //DEBUG: 可能会造成性能损耗
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

        /**
         * 初始化校阅规则
         */
        ebook.InitReviewRules = async () => {
            if (ebook.ReviewRules != null) return;
            ebook.ReviewRules = await DO.GetReviewRules(ebook.BookId);
        }

        /**
         * 校正指定章节
         * @param {*} chapterId
         * @returns 
         */
        ebook.ReviewChapter = async (chapterId) => {
            let RC = async (cId) => {
                let iObj = ebook.Index.filter(i => i.IndexId === cId);
                if (iObj.length <= 0) return null;
                let curContent = ebook.Chapters.get(iObj[0].Title);
                if (curContent === undefined) return null;

                ebook.Chapters.delete(iObj[0].Title);
                [curContent.Title, curContent.Content] = Reviewer(ebook.ReviewRules, [curContent.Title, curContent.Content]);
                ebook.Chapters.set(curContent.Title, curContent);
            }

            if (ebook.ReviewRules == null) await ebook.InitReviewRules();
            if (chapterId === undefined) {
                for (let idx of ebook.Index) {
                    RC(idx.IndexId);
                }
            } else {
                RC(chapterId);
            }

        }

        await ebook.ReloadIndex();

        return ebook;
    }

    /**
     * Do to Po
     * @param {Ebook} book EBook实体
     */
    static async EBookObjToModel(book) {
        let tbook = await DO.GetEBookByName(book.BookName);
        if (tbook != null) DO.DeleteOneBook(tbook.BookId);//已有同名的书先删除 -- 以覆盖方式导入书籍

        if (!book.CoverImg) book.CoverImg = "#f2e3a4";//设定白锦封面
        let PO = Models.GetPO();
        let poBook = await PO.Ebook.create({
            ...book
        });

        for (let i of book.Index) {
            let result = await poBook.createEbookIndex({ ...i, Content: book.Chapters.get(i.Title) });
            // console.log(result);
        }

        return true;
    }

    /**
     * 根据ID获得对应的EBook对象
     * @param {*} bookId 
     * @returns Ebook
     */
    static async GetEBookById(bookId) {
        const myModels = new Models();
        let book = await myModels.Ebook.findByPk(bookId);
        if (book == null) return null;
        return await DO.ModelToEBook(book);
    }
    /**
     * 通过书名查找书
     * @param {*} name 书名（强制去除空格）
     * @returns {Ebook}
     */
    static async GetEBookByName(name) {
        const myModels = new Models();
        let book = await myModels.Ebook.findOne({ where: { bookName: name.trim() } });
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
        let chapter = await myModels.EbookIndex.findByPk(chapterId);
        if (chapter == null) return null;
        let book = await chapter.getEbook();
        let rules = await DO.GetReviewRules(chapter.BookId);
        let chapterObj = new Chapter({ ...chapter.dataValues });
        [chapterObj.Title, chapterObj.Content] = Reviewer(rules, [chapterObj.Title, chapterObj.Content]);
        chapterObj.Book = book.dataValues;
        return chapterObj;
    }

    /**
     * 获取当前章节的相邻章节ID
     * @param {*} chapterId 
     * @returns 
     */
    static async GetEBookChapterNext(chapterId) {
        const myModels = new Models();
        let chapter = await myModels.EbookIndex.findOne({
            attributes: ["BookId", "OrderNum"],
            where: { id: chapterId }
        });
        if (chapter == null) return null;

        let { OrderNum, BookId } = chapter.dataValues;
        let pre = await myModels.EbookIndex.findOne({
            attributes: ["id"],
            where: {
                bookId: BookId,
                OrderNum: {
                    [Models.Op.lt]: OrderNum
                }
            },
            order: [
                ["OrderNum", "DESC"]
            ]
        });
        let next = await myModels.EbookIndex.findOne({
            attributes: ["id"],
            where: {
                bookId: BookId,
                OrderNum: {
                    [Models.Op.gt]: OrderNum
                }
            },
            order: [
                ["OrderNum", "ASC"]
            ]
        });

        return { pre, next };
    }

    /**
     * PO转换为EBook对象 PO to DO
     * @param {*} ebookModel
     * @returns {EBook}
     */
    static async ModelToEBook(ebookModel) {
        return await DO.ModelToBookObj(ebookModel, Ebook);
    }

    /**
     * 取得网文列表
     * @returns 网文对象
     */
    static async GetWebBookList() {
        const myModels = new Models();
        let bookListModels = await myModels.WebBook.findAll({
            include: myModels.Ebook,            //关联查询 webbook join ebook
            order: [["id", "DESC"]]
        });

        let bookList = [];
        for (let b of bookListModels) {
            // console.log(...b.Ebook.dataValues, ...b.dataValues)
            bookList.push(new WebBook({ ...b.Ebook.dataValues, ...b.dataValues }));
        }
        return bookList;
    }

    /**
     * 根据ID获得对应的WebBook对象
     * @param {int} bookId 书的ID
     */
    static async GetWebBookById(bookId) {
        const myModels = new Models();
        let book = await myModels.WebBook.findOne({
            where: { "BookId": bookId }
        });

        if (book == null) return null;

        return await DO.ModelToWebBook(book);
    }
    /**
     * 根据ID获得对应的WebBook的来源地址
     * @param {int} bookId 书的ID
     */
    static async GetWebBookSourcesById(bookId) {
        const myModels = new Models();
        let webBook = await myModels.WebBook.findOne({
            where: { BookId: bookId }
        });
        let bookSources = webBook?.getWebBookIndexSourceURLs();

        if (bookSources == null) return null;

        return await bookSources;
    }

    /**
     * 根据章节ID获取对应的来源地址
     * @param {*} chapterId 章节ID
     */
    static async GetWebBookChapterSourcesById(chapterId) {
        const myModels = new Models();
        let webBook = await myModels.WebBookIndex.findOne({
            include: myModels.WebBookIndexURL,
            where: { IndexId: chapterId }
        });
        if (webBook == null) return null;
        let webBookIndex = await webBook;

        return webBookIndex.WebBookIndexURLs;
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
     * PO 转为WebBook对象-OK
     * @param {Model} webModel 数据库模型 
     * @returns {WebBook} WebBook对象
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
                    WebBookId: webModel.id  //注意：WebBookIndexSourceURL的外键是 webBook.id，与BookId并不等价
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
            await ebookObj.InitReviewRules();       //注意：InitReviewRules定义在 DO.ModelToBookObj 创建的实体上
            for (let i of eIndexs) {
                let eI = await i.getWebBookIndex();

                let tIdx = new WebIndex({ ...i.dataValues, ...eI?.dataValues });
                let urls = await eI?.getWebBookIndexURLs() || [];
                for (let u of urls) tIdx.URL.push(u.Path);

                [tIdx.WebTitle] = Reviewer(ebookObj.ReviewRules, [tIdx.Title])

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
     * 删除书，目前会同时删除Ebook、WebBook
     * TODO: 删除其它格式的数据 如PDF
     * @param {*} bookId 书ID
     */
    static async DeleteOneBook(bookId) {
        const myModels = new Models();

        const ebook = await myModels.Ebook.findOne({ where: { id: bookId } });
        if (ebook == null) return;


        const index = await ebook.getEbookIndex();

        const wbook = await ebook.getWebBook();
        const wbSourceUrl = await wbook?.getWebBookIndexSourceURLs();
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
        for (let wu of wbSourceUrl ?? []) {
            await wu.destroy();
        }
        await wbook?.destroy();
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
                await pdf.ReviewChapter(c.IndexId);
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

    static async GetReviewRules(bookid) {
        let result = [];
        const myModels = new Models();
        let reviewRules = await myModels.ReviewRuleUsing.findAll({
            where: { BookId: bookid }
        });

        for (let rule of reviewRules) {
            let rr = await myModels.ReviewRule.findByPk(rule.RuleId)
            result.push({
                Rule: rr.Rule,
                Replace: rr.Replace
            });
        }

        return result;
    }

    /**
     * 更新章节信息
     * @param {*} chapter 
     */
    static async UpdateChapter(chapter) {
        if (chapter.IndexId * 1 !== chapter.IndexId) return;

        const myModels = new Models();
        let cid = chapter.IndexId;
        delete chapter.IndexId;
        let rsl = await myModels.EbookIndex.update(chapter, { where: { id: cid } });
        return rsl;
    }
}

module.exports = DO;