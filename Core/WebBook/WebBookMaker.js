//爬取、组织、校验等 电子书处理的所有逻辑
const https = require("https");
const fs = require("fs");
const path = require("path");
const { config } = require("./../../config");
const WebBook = require("./../../Entity/WebBook/WebBook");
// const WebIndex = require("./../../Entity/WebBook/WebIndex");
const WebChapter = require("./../../Entity/WebBook/WebChapter");
const { GetDataFromUrl } = require("./GetDataFromUrl");
const RuleManager = require("./RuleManager");
const EventManager = require("./../EventManager");
const DO = require("./../OTO/DO");
const Server = require("./../Server")

/**
 * WebBook - DTO
 */
class WebBookMaker {
    /**
     * 创建一个Web电子书操作器
     * @param { WebBook } webbook 待操作的WebBook对象，或根据提供的目录地址创建一本新书操作器
     * @param { string } webbook 在线图书的网址，通过书目页创建或读取书的对象
     * @param { int } webbook 已在库的书ID，通过ID
     * @returns 
     */
    constructor(webbook) {
        if (typeof (webbook) === "string") {
            this.myWebBook = this.InitEmptyFromIndex(webbook);
            return;
        } else if (typeof (webbook) === "number") {
            this.loadFromDB = DO.GetWebBookById(webbook).then((book) => {
                this.myWebBook = book;
            });
            return;
        }

        if (webbook instanceof WebBook)
            this.myWebBook = webbook;
        else
            this.myWebBook = new WebBook();
    }

    GetBook() {
        return this.myWebBook;
    }

    /**
     * 更新章节目录
     *  更新封面
     * @param {*} url 默认为空，在章节分页时递归往下找
     * @returns 
     */
    async UpdateIndex(url = "", orderNum = 1) {
        let curUrl = url || this.myWebBook.IndexUrl[this.myWebBook.defaultIndex];
        const webRule = await RuleManager.GetRuleByURL(curUrl);
        const option = { RuleList: webRule.index.GetRuleList() }

        return GetDataFromUrl(curUrl, option).then(async (result) => {
            //初始化书名
            if (result.has("BookName") && !this.myWebBook.WebBookName) {
                let bn = result.get("BookName")[0];
                this.myWebBook.WebBookName = bn.text;
                if (!this.myWebBook.BookName) this.myWebBook.BookName = bn.text;
            }

            //根据书名从现有内容取得图书设置
            if (!this.myWebBook.BookId) {   //没登记书ID，则进行数据库初始化
                this.myWebBook = await DO.GetOrCreateWebBookByName(this.myWebBook.WebBookName);
                this.myWebBook.AddIndexUrl(curUrl);
            }


            if (result.has("ChapterList")) {    //爬到的每一章内容
                let cl = result.get("ChapterList");
                if (this.myWebBook.tempMergeIndex == null) this.myWebBook.tempMergeIndex = new Map();
                for (let i of cl)
                    this.myWebBook.MergeIndex({ title: i.text, url: i.url }, orderNum++);       //这里加上 await 可以让存到目录表的数据按顺序
            }

            try {
                if (result.has("BookCover")) {  //保存封面
                    let cv = result.get("BookCover")[0];
                    let imgPath = cv.text;
                    if (imgPath.startsWith("cache::")) imgPath = imgPath.replace("cache::", "");//针对特定情况的补丁代码，应该优化
                    const coverImgDir = `/library/${this.myWebBook.BookName}/cover`;
                    const realDir = config.dataPath + coverImgDir;
                    // console.log(realDir);

                    //判断书目录是否存在，不存在则创建
                    fs.access(realDir, (notExist) => {
                        if (notExist) {
                            Server.MkPath(realDir)
                        }
                    });

                    //获取图片
                    console.debug("尝试获取封面图片：",imgPath);
                    const req = https.request(imgPath, (res) => {
                        const coverImgPath = coverImgDir + "/" + path.basename(imgPath);
                        res.pipe(fs.createWriteStream(config.dataPath + coverImgPath));
                        this.myWebBook.SetCoverImg(coverImgPath);
                        req.end();
                    });
                }
            } catch (err) {
                console.warn("TODO:: 下载设定封面失败！", err);
            }

            //翻页——继续爬
            if (result.has("IndexNextPage")) {
                let npData = result.get("IndexNextPage")[0];
                let nextPage = npData.url;
                if (nextPage == "") {
                    new EventManager().emit("WebBook.UpdateIndex.Finish", this.myWebBook.BookId);
                    return;
                }

                // console.log(`开始爬下一页：${nextPage}`);
                return this.UpdateIndex(nextPage, orderNum);
            } else {
                new EventManager().emit("WebBook.UpdateIndex.Finish", this.myWebBook.BookId);
            }
        });
    }


    /**
     * 更新指定章节-更新正文
     * @param {int} cId 章节Id
     * @param {boolean} isUpdate 是否覆盖更新-默认否
     */
    async UpdateOneChapter(cId, isUpdate = false) {
        if (this.myWebBook == null) {
            console.warn("[WebBookMaker::UpdateOneChapter] 尚未加载电子书，操作失败。");
            return false;
        }

        let curIndex = this.myWebBook.GetIndex(cId);

        if (!curIndex) {
            console.warn(`[WebBookMaker::UpdateOneChapter] 指定章节(ID:${cId})并不存在，请先建立目录。`);
            return false;
        }

        await this.myWebBook.ReloadChapter(cId);    //尝试加载章节内容到内存

        let cs = this.myWebBook.Chapters;
        if (cs.has(curIndex.WebTitle) && !isUpdate) return false;        //已存在的内容跳过

        let url = this.GetDefaultUrl(curIndex.URL);
        if (!url) return false;

        const webRule = await RuleManager.GetRuleByURL(url);
        const option = { RuleList: webRule.chapter.GetRuleList() }

        return await GetDataFromUrl(url, option).then(async (result) => {
            let chap = new WebChapter(curIndex);
            if (result.has("CapterTitle")) {
                chap.Title = result.get("CapterTitle")[0].text;
            }

            if (result.has("Content")) {
                chap.Content = result.get("Content")[0].text;
            }

            //下一页
            if (result.has("ContentNextPage")) {
                let nextPageResult = result.get("ContentNextPage")[0];
                while (nextPageResult.text == nextPageResult.Rule.CheckSetting) {        //TODO: 这应该弄个规则解释器和配套的校验规则表达式
                    let npUrl = nextPageResult.url;
                    if (!npUrl) break;

                    let tempResult = await GetDataFromUrl(npUrl, option);
                    chap.Content += tempResult.get("Content")[0].text;
                    nextPageResult = tempResult.get("ContentNextPage")[0];
                }
            }

            //cs.set(curCp.WebTitle, chap);
            this.myWebBook.AddChapter(chap, isUpdate);

            new EventManager().emit("WebBook.UpdateOneChapter.Finish", this.myWebBook.BookId, cId, chap.WebTitle);
            return true;
        }).catch(() => {
            return false;
        });
    }

    /**
     * 批量更新章节
     * @param {Array} cIndex 章节ID数组
     * @param {boolean} isUpdate 是否覆盖更新-默认否
     */
    async UpdateChapter(cIdArray, isUpdate = false) {
        let doneNum = 0;//已完成数
        let failNum = 0;//已失败次数
        let allNum = cIdArray.length;
        let doList = [];//参与过的列表，用于判断已经启动多少——失败也算
        let em = new EventManager();
        let bookid = this.myWebBook.BookId;

        const _maxLineLength = 10;    //最大的线程次数
        let _curLineNum = 0;   //当前线程数

        em.on("WebBook.UpdateOneChapter.Finish", (bookid, cIdArray) => {
            doneNum++;
            // console.log("🐛 WebBook.UpdateOneChapter.Finish", allNum, doneNum, failNum);
            if (allNum == doneNum + failNum) {
                // console.log("🐛 WebBook.UpdateChapter.Finish")

                em.emit("WebBook.UpdateChapter.Finish", bookid, doList, doneNum, failNum);
                //清除所有监听事件，避免同一监听对象达到10个上限
                //TODO:这可能在并发的时候删掉别人的监听器?
                em.removeListener("WebBook.UpdateOneChapter.Finish");
            }
        });

        const lastId = cIdArray[cIdArray.length - 1];//让最后一步在同步模式下 防止未处理完就退出了
        for (let id of cIdArray) {
            _curLineNum++;

            if (_curLineNum >= _maxLineLength || lastId == id) { //同步
                // console.log("【同步】已开始：章节ID", id);
                await this.UpdateOneChapter(id, isUpdate).then((rsl) => {
                    if (!rsl) failNum++;
                }).catch((err) => {
                    console.warn(`更新失败：ID-${id}，原因：${err}`);
                    failNum++;
                }).finally(() => {
                    _curLineNum--;
                    em.emit("WebBook.UpdateChapter.Process", bookid, (doneNum + failNum) / allNum);
                });
            } else {  //异步
                // console.log("【异步】已开始：章节ID", id);
                this.UpdateOneChapter(id, isUpdate).then((rsl) => {
                    if (!rsl) failNum++;
                }).catch((err) => {
                    console.warn(`更新失败：ID-${id}，原因：${err}`);
                    failNum++;
                }).finally(() => {
                    _curLineNum--;
                    em.emit("WebBook.UpdateChapter.Process", bookid, (doneNum + failNum) / allNum);
                });
            }

            doList.push(id);
        }

        return doList;
    }

    /**
     * 检查空页
     */
    static CheckIsEmpty() {

    }


    /**
     * 从目录页初始化一本空书
     * @param {string} indexUrl 
     */
    InitEmptyFromIndex(indexUrl) {

        let curbook = new WebBook();
        //curbook.BookId = 
        curbook.IndexUrl.push(indexUrl);

        this.myWebBook = curbook;

        return curbook;
    }

    /**
     * 删除指定书的ID
     * @param {*} bookId 书ID
     */
    static async DeleteOneBook(bookId) {
        return await DO.DeleteOneBook(bookId);
    }

    ///----------------私有方法---------------------------

    /**
     * 取得章节来源网址
     * ——多来源时选取合适的地址
     * @param {int} urls 当前章节的所有可用网址
     */
    GetDefaultUrl(urls) {
        let indexUrl = this.myWebBook.IndexUrl[this.myWebBook.defaultIndex];
        let hostName = RuleManager.GetHost(indexUrl);

        //TODO:
        for (let u of urls) {
            if (u.includes(hostName)) return u;
        }

        return urls[0];
    }

}


module.exports = WebBookMaker;