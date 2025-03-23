//爬取、组织、校验等 电子书处理的所有逻辑
const path = require("path");
const config = require("../../config");
const WebBook = require("../../Entity/WebBook/WebBook");
// const WebIndex = require("../../Entity/WebBook/WebIndex");
const WebChapter = require("../../Entity/WebBook/WebChapter");
const RuleManager = require("./RuleManager");
const EventManager = require("../EventManager");
const DO = require("../OTO/DO");
const WorkerPool = require("../Worker/WorkerPool");
const wPool = WorkerPool.GetWorkerPool();

/**
 * WebBook - DTO
 */
class WebBookMaker {
    /**
     * 创建一个Web电子书操作器
     * @param { WebBook | string | number | undefined} 
     * WebBook 待操作的WebBook对象，或根据提供的目录地址创建一本新书操作器
     * string 在线图书的网址，通过书目页创建或读取书的对象
     * number 已在库的书ID，通过ID
     * undefined 空对象，创建空书对象
     * @returns 
     */
    constructor(webbook) {
        this.isCreateBook = false;  //是否新创建的书
        if (typeof (webbook) === "string") {     //传入网址
            this.myWebBook = this.InitEmptyFromIndex(webbook);
            return;
        } else if (typeof (webbook) === "number") {
            this.loadFromDB = DO.GetWebBookById(webbook).then((book) => {
                this.myWebBook = book;
            });
            return;
        } else if (webbook instanceof WebBook) {
            this.myWebBook = webbook;
        } else {
            this.myWebBook = new WebBook();
        }
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

        wPool.RunTask({
            taskfile: "@/Core/Utils/GetDataFromUrl",
            param: {
                url: curUrl,
                setting: option
            },
            taskType: "puppeteer",
            maxThreadNum: 10
        }, async (result) => {
            if (result == null) {
                new EventManager().emit("WebBook.UpdateIndex.Error");
                return;
            }
            //初始化书名
            if (result.has("BookName") && !this.myWebBook.WebBookName) {
                let bn = result.get("BookName")[0];
                this.myWebBook.WebBookName = bn.text;
                if (!this.myWebBook.BookName) this.myWebBook.BookName = bn.text;
            }

            //根据书名从现有内容取得图书设置
            if (!this.myWebBook.BookId) {   //没登记书ID，则进行数据库初始化
                this.myWebBook = await DO.GetOrCreateWebBookByName(this.myWebBook.WebBookName);
                this.isCreateBook = this.myWebBook.isNewCreate;
                await this.myWebBook.AddIndexUrl(curUrl);
            }

            if (result.has("ChapterList")) {    //爬到的每一章内容
                let cl = result.get("ChapterList");
                if (this.myWebBook.tempMergeIndex == null) this.myWebBook.tempMergeIndex = new Map();
                for (let i of cl)
                    await this.myWebBook.MergeIndex({ title: i.text, url: i.url }, orderNum++);       //这里加上 await 可以让存到目录表的数据按顺序
            }

            if (result.has("BookCover")) {  //保存封面
                let cv = result.get("BookCover")[0];
                let imgPath = cv.text;
                if (imgPath?.startsWith("cache::")) imgPath = imgPath.replace("cache::", "");//针对特定情况的补丁代码，应该优化

                const coverImgPath = path.join("/library", this.myWebBook.BookName, "cover", path.basename(imgPath));//图片存储的相对位置
                const saveImageFilePath = path.join(config.dataPath, coverImgPath);
                new EventManager().emit("Debug.Log", `尝试获取封面图片：${imgPath}\n存储目录：${saveImageFilePath}`, "WEBBOOKCOVER");
                wPool.RunTaskAsync({
                    taskfile: "@/Core/Utils/CacheFile",
                    param: {
                        url: imgPath,
                        savePath: saveImageFilePath
                    },
                    highPriority: true
                }).then((result) => {
                    new EventManager().emit("Debug.Log", `封面图片缓存成功：\n${coverImgPath}\n${saveImageFilePath}\n`, "WEBBOOKCOVER", result);
                    this.myWebBook.SetCoverImg(coverImgPath);
                }).catch(err => {
                    new EventManager().emit("Debug.Log", `封面图片缓存失败：\n${imgPath}\n${coverImgPath}\n${saveImageFilePath}\n`, "WEBBOOKCOVER", err);
                });
            }

            let finishMsg = "WebBook.UpdateIndex.Finish";
            if (this.isCreateBook) finishMsg = "WebBook.Create.Finish";
            //翻页——继续爬 CheckSetting
            if (result.has("IndexNextPage")) {
                let npDataList = result.get("IndexNextPage");
                npDataList = npDataList.filter(item => !item.Rule.CheckSetting || item.Rule.CheckSetting == item.text);
                if (npDataList.length == 0) return;
                let npData = npDataList[0];
                let nextPage = npData.url;
                if (nextPage == "" || nextPage == url) {
                    new EventManager().emit(finishMsg, this.myWebBook.BookId, this.myWebBook.BookName);
                    return;
                }

                // console.log(`开始爬下一页：${nextPage}`);
                return this.UpdateIndex(nextPage, orderNum);
            } else {
                new EventManager().emit(finishMsg, this.myWebBook.BookId, this.myWebBook.BookName);
            }
        });
    }


    /**
     * 更新指定章节-更新正文
     * @param {int} cId 章节Id
     * @param {boolean} isUpdate 是否覆盖更新-默认否
     */
    async UpdateOneChapter(cId, isUpdate = false, jobId = "") {
        let curIndex = this.myWebBook?.GetIndex(cId);

        if (!curIndex) {
            // console.warn(`[WebBookMaker::UpdateOneChapter] 指定章节(ID:${cId})并不存在，请先建立目录。`);
            new EventManager().emit(`WebBook.UpdateOneChapter.Error`, this.myWebBook?.BookId, cId, new Error(`[WebBookMaker::UpdateOneChapter] 指定章节(ID:${cId})并不存在，请先建立目录。`), jobId);
            return false;
        }

        await this.myWebBook.ReloadChapter(cId);    //尝试加载章节内容到内存

        let cs = this.myWebBook.Chapters;
        if (cs.has(curIndex.WebTitle) && !isUpdate) {
            new EventManager().emit(`WebBook.UpdateOneChapter.Error`, this.myWebBook?.BookId, cId, "已有内容，未选择强制更新，已跳过。", jobId);
            return false;        //已存在的内容跳过
        }

        let url = this.GetDefaultUrl(curIndex.URL);
        if (!url) return false;

        const webRule = await RuleManager.GetRuleByURL(url);
        const option = { RuleList: webRule.chapter.GetRuleList() }

        wPool.RunTask({
            taskfile: "@/Core/Utils/GetDataFromUrl",
            param: {
                url: url,
                setting: option
            },
            taskType: "puppeteer",
            maxThreadNum: 10
        }, async (result, err) => {
            if (err) {
                new EventManager().emit(`WebBook.UpdateOneChapter.Error`, this.myWebBook?.BookId, cId, err, jobId);
                return;
            }

            let chap = new WebChapter(curIndex);
            if (result.has("CapterTitle")) {
                let cTitleResult = result.get("CapterTitle")[0];
                if (!cTitleResult.text) {
                    let errAdd = "";
                    if (!cTitleResult.GetContentAction) errAdd = "，爬站规则-获取内容规则尚未配置";
                    new EventManager().emit(`WebBook.UpdateOneChapter.Error`, this.myWebBook?.BookId, cId, "获取章节标题失败" + errAdd, jobId);
                    return;
                }
                chap.Title = cTitleResult.text;
            }

            if (result.has("Content")) {
                let cContentResult = result.get("Content")[0];
                if (!cContentResult.text) {
                    let errAdd = "";
                    if (!cContentResult.GetContentAction) errAdd = "，爬站规则-获取内容规则尚未配置";
                    new EventManager().emit(`WebBook.UpdateOneChapter.Error`, this.myWebBook?.BookId, cId, "获取章节内容失败" + errAdd, jobId);
                    return;
                }
                chap.Content = cContentResult.text;
            }

            //下一页
            if (result.has("ContentNextPage")) {
                let nextPageResult = result.get("ContentNextPage")[0];
                let nextPageUrl = url;
                while (nextPageResult.text?.includes(nextPageResult.Rule.CheckSetting)) {        //TODO: 这应该弄个规则解释器和配套的校验规则表达式
                    if (nextPageUrl == nextPageResult?.url) break;        //防止死循环
                    nextPageUrl = nextPageResult.url;
                    if (!nextPageUrl) break;

                    // let tempResult = await GetDataFromUrl(npUrl, option);

                    let tempResult = await wPool.RunTaskAsync({
                        taskfile: "@/Core/Utils/GetDataFromUrl",
                        param: {
                            url: nextPageUrl,
                            setting: option
                        },
                        taskType: "puppeteer",
                        maxThreadNum: 10
                    });

                    chap.Content += tempResult.get("Content")[0].text;
                    nextPageResult = tempResult.get("ContentNextPage")[0];          //TODO: 需要更合适的方式找到命中的那页
                }
            }

            //cs.set(curCp.WebTitle, chap);
            this.myWebBook.AddChapter(chap, isUpdate);

            const em = new EventManager();
            em.emit(`WebBook.UpdateOneChapter.Finish_${jobId}`, this.myWebBook.BookId, cId, chap.WebTitle);
            em.emit(`WebBook.UpdateOneChapter.Finish`, this.myWebBook.BookId, cId, chap.WebTitle);
        });
        return true;
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
        let myBookId = this.myWebBook.BookId;

        let jobId = Math.random().toString();


        let _updateProcess = (chapterId, ok, fail, all) => {
            // console.log(chapterId, ok, fail, all)
            em.emit("WebBook.UpdateChapter.Process", myBookId, chapterId, (ok + fail) / all, ok, fail, all);
            if (all == ok + fail) em.emit("WebBook.UpdateChapter.Finish", myBookId, this.myWebBook.BookName, doList, ok, fail);
        }

        //之前的监听器关掉——如果有
        if (em.listenerCount(`WebBook.UpdateOneChapter.Finish_${jobId}`) > 0) em.removeAllListeners(`WebBook.UpdateOneChapter.Finish_${jobId}`);
        if (em.listenerCount(`WebBook.UpdateOneChapter.Error_${jobId}`) > 0) em.removeAllListeners(`WebBook.UpdateOneChapter.Error_${jobId}`);

        //重设本次的监听器
        em.on(`WebBook.UpdateOneChapter.Finish_${jobId}`, (bookid, chapterId, title) => {
            if (myBookId != bookid) return;
            doneNum++;
            _updateProcess(chapterId, doneNum, failNum, allNum);
        });
        em.on(`WebBook.UpdateOneChapter.Error_${jobId}`, (bookid, chapterId, err) => {
            if (myBookId != bookid) return;
            failNum++;
            _updateProcess(chapterId, doneNum, failNum, allNum);
        });

        //安排任务
        for (let id of cIdArray) {
            this.UpdateOneChapter(id, isUpdate, jobId).then((rsl) => {
                if (!rsl) failNum++;
            }).catch((err) => {
                console.warn(`更新失败：ID-${id}，原因：${err.message}`);
                // failNum++;
                em.emit(`WebBook.UpdateOneChapter.Error_${jobId}`, myBookId, id, err);
            });
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
     * @returns {WebBook}
     */
    InitEmptyFromIndex(indexUrl) {
        let curbook = new WebBook();
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
            if (u.Path.includes(hostName)) return u.Path;
        }

        return urls[0];
    }

}


module.exports = WebBookMaker;