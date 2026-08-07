import DO from "./index.js";
import Models from "../Models/index.js";
import Ebook from "../../../Entity/Ebook/Ebook.js";
import Volume from "../../../Entity/Ebook/Volume.js";
import WebBook from "../../../Entity/WebBook/WebBook.js";
import WebIndex from "../../../Entity/WebBook/WebIndex.js";
import WebChapter from "../../../Entity/WebBook/WebChapter.js";
import SystemConfigService from "../../services/SystemConfig.js";
import { Run as Reviewer } from "../../Utils/ReviewString.js";


export default class OTO_WebBook {

    /**
     * 取得网文列表
     * @param {int} tagid 标签ID
     * @param {int[]} nottag 不包含的标签ID
     */
    static async GetWebBookList(tagid, nottag) {
        const myModels = new Models();
        let bookListModels = await myModels.WebBook.findAll({
            include: myModels.Ebook,            //关联查询 webbook join ebook
            order: [["id", "DESC"]]
        });

        let bookList = [];
        for (let b of bookListModels) {
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
     * 获取对应书的默认来源地址
     * @param {*} bookId 
     * @returns 
     */
    static async GetWebBookDefaultSourcesById(bookId) {
        const myModels = new Models();
        let webBook = await myModels.WebBook.findOne({
            where: { BookId: bookId }
        });
        let bookSources = await webBook?.getWebBookIndexSourceURLs();

        return bookSources[webBook.defaultIndex];
    }

    /**
     * 根据章节ID获取对应的来源地址
     * @param {*} chapterId 章节ID
     */
    static async GetWebBookChapterSourcesById(chapterId) {
        if (!chapterId) return [];
        const myModels = new Models();
        // console.log("GetWebBookChapterSourcesById::", chapterId);
        // 直接查 URL 表
        const urls = await myModels.WebBookIndexURL.findAll({
            include: [{
                model: myModels.WebBookIndex, // 关联章节表
                where: { IndexId: chapterId },
                attributes: [], // 不需要查章节字段，只用来做过滤
                required: true  // 转为 INNER JOIN，确保关联存在才返回
            }],
            raw: true,
        });

        return urls; // 直接返回纯净的 URL 数组
    }

    static async SetWebBookChapterSources(id, url) {
        const myModels = Models.GetPO();
        let rsl = await myModels.WebBookIndexURL.update(
            {
                Path: url,
            },
            {
                where: {
                    id: id
                }
            });
        return rsl;
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
        let book = await myModels.WebBook.findOne({
            where: { WebBookName: bookName }
        });

        let created = false;
        if (book == null) {//没找到对应的WebBook，进行创建
            const trans = await myModels.BeginTrans();
            let [ebook, ecreated] = await myModels.Ebook.findOrCreate({
                where: { BookName: bookName },
                transaction: trans
            });

            if (ecreated) {
                book = await myModels.WebBook.create({
                    WebBookName: bookName,
                    BookId: ebook.id,
                }, { transaction: trans });
                trans.commit();
                created = true;
            } else if (ebook) {
                //创建电子书失败，已存在同名书籍。
                await trans.rollback();
                return null;
            }
        }

        const webBook = await DO.ModelToWebBook(book);
        webBook.isNewCreate = created;
        return webBook;
    }

    /**
     * PO 转为WebBook对象-OK
     * @param {Model} webModel 数据库模型 
     * @returns {WebBook} WebBook对象
     */
    static async ModelToWebBook(webModel) {
        let ebook = await webModel?.getEbook();
        let ebookObj = await DO.ModelToBookObj(ebook, Ebook);
        // await ebookObj.LoadIntroduction();
        let webBook = new WebBook({ WebBookId: webModel.id, ...webModel.dataValues, ...ebook.dataValues, Introduction: ebookObj.Introduction });
        let urls = await webModel.getWebBookIndexSourceURLs({
            attributes: ['Path'],
            raw: true
        });
        webBook.IndexUrl = urls?.map(u => u.Path);

        webBook.SetCoverImg = async (path) => { return await ebookObj.SetCoverImg(path); }
        webBook.LoadIntroduction = async () => { return await ebookObj.LoadIntroduction(); }

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
            await ebookObj.InitReviewRules();       //注意：InitReviewRules定义在 DO.ModelToBookObj 创建的实体上

            //通过默认目录地址推断出站点
            let sourceUrls = await webModel.getWebBookIndexSourceURLs({
                attributes: ["Path"],
                raw: true,
            });
            let defaultIndex = webBook.defaultIndex;
            if (defaultIndex > sourceUrls.length) defaultIndex = 0;
            const defaultHost = sourceUrls.length > 0 ? new URL(sourceUrls[defaultIndex].Path).host : null;

            let eIndexs = await myModels.EbookIndex.scope('withHasContent').findAll({
                where: {
                    BookId: webBook.BookId,
                    OrderNum: { [Models.Op.gte]: 0 } //大于0的章节
                },
                attributes: {
                    //["Title", "OrderNum", "id", "VolumeId"],
                    exclude: ['Content', "createdAt", "updatedAt"]   //不需要的列 避免大字段Content查询的开销
                },
                include: [{
                    model: myModels.WebBookIndex,
                    as: "WebBookIndex",
                    include: [{
                        model: myModels.WebBookIndexURL,
                        as: "WebBookIndexURLs",
                        attributes: ["id", "Path"],
                    }],
                    attributes: ["WebTitle"]
                }],
                order: ["OrderNum"],
            });

            for (let i of eIndexs) {
                let bIdx = i.toJSON();
                [bIdx.Title] = Reviewer(ebookObj.ReviewRules, [bIdx.Title])
                let WebTitle = bIdx?.WebBookIndex?.WebTitle;
                let tIdx = new WebIndex({ WebTitle, URL: bIdx?.WebBookIndex?.WebBookIndexURLs, curHost: defaultHost, ...bIdx });
                webBook.Index.push(tIdx);
            }
        }

        /**
         * 从数据库加载指定章节
         * @param {*} cId 章节ID
         */
        webBook.ReloadChapter = async (cId) => {
            let ebookIndex = await new Models().EbookIndex.findOne({ where: { id: cId, BookId: webBook.BookId } });
            if (ebookIndex == null || !ebookIndex.Content) return;
            let wbookIndex = await ebookIndex.getWebBookIndex();
            if (wbookIndex == null) return;
            let cp = new WebChapter({ ...wbookIndex.dataValues, ...ebookIndex.dataValues });
            if (cp.Content) webBook.Chapters.set(cp.WebTitle, cp);          //TODO: 这里限制了章节名称不能相同
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
         * @returns 是否添加了新章节
         */
        webBook.MergeIndex = async ({ title, url }, orderNum) => {
            const myModels = new Models();
            let hasAddChapter = false;
            if (webBook.tempMergeIndex == null) webBook.tempMergeIndex = new Map();

            if (webBook.tempMergeIndex.has(title)) {    //发现重复章节，需要合并
                webBook.tempMergeIndex.get(title).urls.push(url);//没啥用，没存入数据库的
                await myModels.EbookIndex.update({ OrderNum: orderNum }, { where: { BookId: webBook.BookId, Title: title } });//如果相同的章节重复出现，按最新的排序更新
                return;
            }
            webBook.tempMergeIndex.set(title, { urls: [url] });

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
                hasAddChapter = true;
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
            return hasAddChapter;
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


        webBook.Volumes = ebookObj.Volumes.concat();
        webBook.GetMaxIndexOrder = ebookObj.GetMaxIndexOrder;
        await webBook.ReloadIndex();
        return webBook;
    }


    /**
     * 设置网文是否允许自动更新
     * 自动更新将在系统闲时，后台静默更新。若设置为启用，将同时将该书的空章节在更新队列安排到队首
     * @param {number} bookid 
     * @param {boolean} autoSyncEnabled 
     */
    static async WebBookSetAutoSync(bookid, autoSyncEnabled) {
        const myModels = Models.GetPO();
        let [rows] = await myModels.WebBook.update({ AutoSyncEnabled: autoSyncEnabled, }, { where: { BookId: bookid } });

        if (rows > 0 && autoSyncEnabled) {
            [rows] = await myModels.EbookIndex.update({ Content: null }, {
                where: {
                    BookId: bookid,
                    Content: { [Models.Op.eq]: "" }
                }
            });
        }
        return rows > 0;
    }


}


