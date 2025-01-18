const DO = require("./index");
const WebBook = require("./../../../Entity/WebBook/WebBook");


class OTO_WebBook {


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


}

module.exports = OTO_WebBook;
