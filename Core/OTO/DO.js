const Models = require("./Models.js");
const WebBook = require("../../Entity/WebBook/WebBook.js");
const WebIndex = require("../../Entity/WebBook/WebIndex.js");
const WebChapter = require("../../Entity/WebBook/WebChapter.js");


/**
 * doToPo
 */
class DO {
    constructor() { }

    /**
     * 传输对象转换为EBook对象
     * @param {*} ebModel 
     */
    static async ModelToEBook(ebModel) {


    }


    /**
     * 数据库对象传输为WebBook对象
     * @param {Model} ebModel 数据库模型 
     * @returns WebBook 对象
     */
    static async ModelToWebBook(ebModel) {
        let ebook = await ebModel?.getEbook();
        let webBook = new WebBook({ ...ebModel.dataValues, ...ebook.dataValues });
        let urls = await ebModel.getWebBookIndexSourceURLs();
        for (var u of urls) webBook.IndexUrl.push(u.Path);

        /**
         * 添加来源地址
         * @param {*} url 
         */
        webBook.AddIndexUrl = async (url) => {
            if (!webBook.IndexUrl.includes(url)) {
                webBook.IndexUrl.push(url);
                let ret = await new Models().WebBookIndexSourceURL.create({
                    Path: url,
                    WebBookId: webBook.BookId
                });
            }
        }

        //从数据库加载章节信息
        webBook.ReloadIndex = async () => {
            const myModels = new Models();
            let eIndexs = await myModels.EbookIndex.findAll({ where: { BookId: webBook.BookId }, order: ["OrderNum"] });
            for (let i of eIndexs) {
                let eI = await i.getWebBookIndex();

                let tIdx = new WebIndex({ ...i.dataValues, ...eI.dataValues });
                let urls = await eI.getWebBookIndexURLs();
                for (let u of urls) tIdx.URL.push(u.Path);

                webBook.Index.push(tIdx);
            }
        }
        /**
         * 从数据库加载指定章节
         * @param {*} index 章节序号
         */
        webBook.ReloadChapter = async (index) => {
            const indexInfo = webBook.Index[index];
            if (!indexInfo) return;

            let ebookIndex = await new Models().EbookIndex.findOne({ where: { id: indexInfo.IndexId } });
            if (ebookIndex == null) return;
            let wbookIndex = await ebookIndex.getWebBookIndex();
            let cp = new WebChapter({ ...wbookIndex.dataValues, ...ebookIndex.dataValues });
            if (cp.Content) webBook.Chapters.set(cp.WebTitle, cp);
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
                where: { WebTitle: title }
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

    //static 
}

module.exports = DO;