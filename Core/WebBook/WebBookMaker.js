//爬取、组织、校验等 电子书处理的所有逻辑
import path from "node:path";
import { config } from "../services/config.js";
import Message from "../../Entity/Message.js";
import WebBook from "../../Entity/WebBook/WebBook.js";
// import WebIndex from "../../Entity/WebBook/WebIndex.js";
import WebChapter from "../../Entity/WebBook/WebChapter.js";
import RuleManager from "./RuleManager.js";
import * as SiteHelper from "../Utils/SiteHelper.js";
import Serialize from "../Utils/Serialize.js";
import EventManager from "../EventManager.js";
import DO from "../OTO/DO/index.js";
import WorkerPool from "../Worker/WorkerPool.js";
import BookMaker, { SHOW_BOOKNAME } from "../Book/BookMaker.js";
const wPool = WorkerPool.GetWorkerPool();

/**
 * WebBook - DTO
 */
export default class WebBookMaker {
    /**
     * 创建一个Web电子书操作器
     * @param { WebBook | string | number | undefined} 
     * WebBook 待操作的WebBook对象，或根据提供的目录地址创建一本新书操作器
     * string 在线图书的网址，通过书目页创建或读取书的对象
     * number 已在库的书ID，通过ID
     * undefined 空对象，创建空书对象
     * @returns {WebBookMaker} 返回一个WebBookMaker对象
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

    /**
     * 根据目录地址创建一本新书
     * @param {*} url 目录地址
     * @returns {WebBook} 返回新创建的书对象
     */
    GetBook() {
        return this.myWebBook;
    }

    /**
     * 更新章节目录 抓目录
     *  更新封面
     * @param {boolean?} isEmbedBookName （如果封面是图片时）是否在封面嵌入书名 若为null则沿用之前的设置
     * @param {string} url 默认为空，在章节分页时递归往下找
     * @param {number} [orderNum=1] 章节排序开始序号
     * @returns 
     */
    async UpdateIndex(isEmbedBookName, url = "", orderNum = 1) {
        let curUrl = url || this.myWebBook.IndexUrl[this.myWebBook.defaultIndex];
        const webRule = await RuleManager.GetRuleByURL(curUrl);
        let { index, chapter, ...option } = { ...webRule };
        option.RuleList = index.GetRuleList();

        wPool.RunTask({
            taskfile: "@/Core/Utils/GetDataFromUrl/index.js",
            param: {
                url: curUrl,
                setting: option
            },
            taskType: "puppeteer",
            maxThreadNum: 10
        }, async (result, err) => {
            if (result == null || err != null) {
                new EventManager().emit("WebBook.UpdateIndex.Error", Serialize.Error(err), curUrl, Serialize.Result(result));
                return;
            }
            let addChapterNum = 0;
            let nameFromWeb = null;//从网页取得的原始名，当ebook版本名已存在时尝试以原始名处理
            //初始化书名
            if (result.has("BookName")) {
                let bn = result.get("BookName")[0];
                nameFromWeb = bn.text;
                //去掉书名中的注释部分
                let tempName = bn.text;
                if (/[（\(【]/.test(tempName)) {
                    tempName = tempName.split(/[（\(【]/)[0];
                }
                if (!tempName) {
                    new EventManager().SendErrorToUI(new Message(`请验证抓取规则、检查网站的可访问性。`, "notice", {
                        title: "获取书名失败",
                        subTitle: "可能抓取规则出错",
                    }), Object.fromEntries(result));
                    return;
                }

                if (!this.myWebBook.WebBookName) {  //初始化空书的情况
                    this.myWebBook.WebBookName = tempName;
                    if (!this.myWebBook.BookName) this.myWebBook.BookName = tempName;
                } else if (this.myWebBook.WebBookName != tempName) {
                    new EventManager().SendErrorToUI(new Message(`原书名：《${this.myWebBook.BookName}》；新书名：《${tempName}》。书名不同无法合并，建议重新录入，这将会创建一本新书。`, "notice", {
                        title: "更新目录失败：书名已发生变更",
                        subTitle: "目标书籍可能发生改变",
                    }), Object.fromEntries(result));
                    return;
                }
            }

            //根据书名从现有内容取得图书设置
            if (!this.myWebBook.BookId) {   //没登记书ID，则进行数据库初始化
                const name1fst = this.myWebBook.WebBookName;
                const name2sec = nameFromWeb;
                this.myWebBook = await DO.GetOrCreateWebBookByName(name1fst);
                if (!this.myWebBook && name2sec && name1fst != name2sec) {
                    this.myWebBook = await DO.GetOrCreateWebBookByName(name2sec);  //格式化过的名冲突的概率高，创建失败的话尝试以原始书名再试试
                }

                if (!this.myWebBook) {//创建书失败
                    let secondtry = name1fst != name2sec ? `、《${nameFromWeb}》均` : "";
                    new EventManager().SendErrorToUI(new Message(`已尝试使用书名《${this.myWebBook.WebBookName}》${secondtry}失败，请检查采集结果和查看相关信息。`, "notice", {
                        title: "添加新书初始化失败",
                        subTitle: "可能已存在同名书籍",
                    }), Object.fromEntries(result));
                    return;
                }

                this.isCreateBook = this.myWebBook.isNewCreate;
                await this.myWebBook.AddIndexUrl(curUrl);
            }

            if (result.has("ChapterList")) {    //爬到的每一章内容
                let cl = result.get("ChapterList");
                if (cl.length == 0) {       //没抓到章节数据
                    new EventManager().SendErrorToUI(new Message(`《${this.myWebBook.BookName}》返回章节列表为空。`, "notice", {
                        title: "更新目录失败，返回章节为空",
                        subTitle: "请检查抓取规则是否正确。",
                        //avatar:this.myWebBook.CoverImg
                    }), Object.fromEntries(result));
                    return;
                }
                for (let i of cl) {
                    let hasAdd = await this.myWebBook.MergeIndex({ title: i.text, url: i.url }, orderNum++);
                    if (hasAdd) addChapterNum++;
                }
            }

            if (result.has("BookCover")) {  //保存封面
                if (isEmbedBookName === null) {
                    isEmbedBookName = this.myWebBook.CoverImg?.endsWith(SHOW_BOOKNAME);
                }

                let cv = result.get("BookCover")[0];
                let imgPath = cv.text;
                if (imgPath?.startsWith("cache::")) imgPath = imgPath.replace("cache::", "");//针对特定情况的补丁代码，应该优化

                let coverImgPath = path.join(config.FOLDER.BookCover, `${this.myWebBook.BookName}_${path.basename(imgPath)}`);//图片存储的相对位置
                const saveImageFilePath = path.join(config.dataPath, coverImgPath);
                new EventManager().emit("Debug.Log", `尝试获取封面图片：${imgPath}\n存储目录：${saveImageFilePath}`, "WEBBOOKCOVER");
                wPool.RunTaskAsync({
                    taskfile: "@/Core/Utils/CacheFile.js",
                    param: {
                        url: imgPath,
                        savePath: saveImageFilePath
                    },
                    highPriority: true
                }).then((result) => {
                    new EventManager().emit("Debug.Log", `封面图片缓存成功：\n${coverImgPath}\n${saveImageFilePath}\n`, "WEBBOOKCOVER", result);
                    if (isEmbedBookName && !coverImgPath.endsWith(SHOW_BOOKNAME)) coverImgPath += SHOW_BOOKNAME;
                    this.myWebBook.SetCoverImg(coverImgPath);
                }).catch(err => {
                    new EventManager().emit("Debug.Log", `封面图片缓存失败：\n${imgPath}\n${coverImgPath}\n${saveImageFilePath}\n`, "WEBBOOKCOVER", Serialize.Error(err));
                });
            }

            if (result.has("Author")) {  //保存作者
                let authorRule = result.get("Author")[0];
                if (authorRule) {
                    let tempAuthor = authorRule.text;
                    for (let rm of authorRule.Rule.RemoveSelector) {
                        tempAuthor = tempAuthor.replace(rm, "");
                    }
                    if (!this.myWebBook.Author) BookMaker.EditEBookInfo(this.myWebBook.BookId, { "Author": tempAuthor });
                    this.myWebBook.Author = tempAuthor;
                }
            }

            if (result.has("Introduction")) {  //保存简介
                let desc = result.get("Introduction")[0];
                if (desc?.text) BookMaker.EditEbookIntroduction(this.myWebBook.BookId, desc.text);
            }

            let data = { addChapterNum };
            let finishMsg = "WebBook.UpdateIndex.Finish";
            if (this.isCreateBook) finishMsg = "WebBook.Create.Finish";
            //翻页——继续爬 CheckSetting
            if (result.has("IndexNextPage")) {
                let npDataList = result.get("IndexNextPage");
                npDataList = npDataList.filter(item => !item.Rule.CheckSetting || item.Rule.CheckSetting == item.text);
                let isFinish = false;
                if (npDataList.length == 0) isFinish = true;
                let npData = npDataList[0];
                let nextPage = npData?.url;
                if (isFinish || nextPage == "" || nextPage == url) {
                    new EventManager().emit(finishMsg, this.myWebBook.BookId, this.myWebBook.BookName, data);
                    return;
                }

                return this.UpdateIndex(isEmbedBookName, nextPage, orderNum);
            } else {
                new EventManager().emit(finishMsg, this.myWebBook.BookId, this.myWebBook.BookName, data);
            }
        });
    }


    /**
     * 更新指定章节-更新正文
     * @param {int} cId 章节Id
     * @param {boolean} isUpdate 是否覆盖更新-默认否
     * @param {string} [jobId=""] 任务ID，批量抓章节时，为同一批任务定义一个任务ID
     * @param {undefined} [defaultContent=undefined] （任务失败时）设置默认的章节正文
     */
    async UpdateOneChapter(cId, isUpdate = false, jobId = "", defaultContent = undefined) {
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
        if (!url) {
            if (defaultContent != undefined) {
                curIndex.Content = defaultContent;
                this.myWebBook.AddChapter(new WebChapter(curIndex))
            }
            return false;
        }

        let error = null;
        const webRule = await RuleManager.GetRuleByURL(url).catch(err => error = err);
        if (error && defaultContent != undefined) {
            curIndex.Content = defaultContent;
            this.myWebBook.AddChapter(new WebChapter(curIndex))
            return false;
        }
        const { index, chapter, ...option } = { ...webRule };
        option.RuleList = chapter.GetRuleList();

        wPool.RunTask({
            taskfile: "@/Core/Utils/GetDataFromUrl/index.js",
            param: {
                url: url,
                setting: option
            },
            taskType: "puppeteer",
            maxThreadNum: 10
        }, async (result, err) => {
            if (err) {
                err = Serialize.Error(err);
                new EventManager().emit(`WebBook.UpdateOneChapter.Error`, this.myWebBook?.BookId, cId, err, jobId, err);
                if (defaultContent === undefined) return;
            }

            let chap = new WebChapter(curIndex);
            if (result?.has("CapterTitle")) {
                let cTitleResult = result.get("CapterTitle")[0];
                if (cTitleResult?.text) chap.WebTitle = cTitleResult.text;
            }

            if (defaultContent !== undefined) {
                chap.Content = defaultContent;
            }

            if (result?.has("URL")) {
                const resultURL = result.get("URL");
                console.warn(`《${this.myWebBook.BookName}》章节： ${chap.WebTitle} ,${resultURL.message}\n请求地址：${resultURL.expect};\n响应地址：${resultURL.actual}`);
            }

            if (result?.has("Content")) {
                const contResult = result.get("Content");
                let [cContentResult, errObj, pageSources] = contResult;
                if (!cContentResult.text) {
                    errObj = Serialize.Error(errObj || {});
                    let { message } = errObj;
                    let errAdd = "";
                    if (message) errAdd = "，" + message;
                    else if (!cContentResult.GetContentAction) errAdd = "，爬站规则-获取正文规则尚未配置或配置错误";
                    new EventManager().emit(`WebBook.UpdateOneChapter.Error`, this.myWebBook?.BookId, cId, "获取章节正文失败" + errAdd, jobId, { result: Serialize.Result(result), ...errObj });
                    if (defaultContent === undefined) return;
                } else
                    chap.Content = cContentResult.text;
            }

            //下一页
            if (result?.has("ContentNextPage")) {
                let nextPageResult = result.get("ContentNextPage")[0];
                let nextPageUrl = url;
                while (nextPageResult?.text?.includes(nextPageResult.Rule.CheckSetting)) {        //TODO: 这应该弄个规则解释器和配套的校验规则表达式
                    if (nextPageUrl == nextPageResult?.url) break;        //防止死循环
                    nextPageUrl = nextPageResult.url;
                    if (!nextPageUrl) break;

                    let tempResult = await wPool.RunTaskAsync({
                        taskfile: "@/Core/Utils/GetDataFromUrl/index.js",
                        param: {
                            url: nextPageUrl,
                            setting: option
                        },
                        taskType: "puppeteer",
                        maxThreadNum: 10,
                        highPriority: true,
                    });

                    if (!tempResult.get("Content")[0].text) {
                        console.log("存在内容缺页，请重新抓取试试：", nextPageUrl, tempResult);
                        //throw new Error(`存在内容缺页，请重新抓取试试：${nextPageUrl}`)
                        return false;
                    }
                    chap.Content += tempResult.get("Content")[0].text;
                    nextPageResult = tempResult.get("ContentNextPage")[0];          //TODO: 需要更合适的方式找到命中的那页
                }
            }

            const thisCP = this.myWebBook.Index.find(item => item.IndexId == cId) || {};
            if (thisCP.WebTitle && thisCP.WebTitle != chap.WebTitle) {
                console.warn(`《${this.myWebBook.BookName}》章节：${thisCP.WebTitle} 与抓取章节： ${chap.WebTitle} 标题不一致，请确认。`);
            }
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
                em.emit(`WebBook.UpdateOneChapter.Error_${jobId}`, myBookId, id, Serialize.Error(err));
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
     * 删除指定ID的书
     * # 删除 WebBook 及对应的 EBook 资料
     * @param {*} bookId 书ID
     */
    static async DeleteOneBook(bookId) {
        return await DO.DeleteOneBook(bookId);
    }

    ///----------------私有方法---------------------------

    /**
     * 取得章节来源网址
     * ——多来源时选取合适的地址
     * @param {{id:number,Path:string}} urls 当前章节的所有可用网址
     * @returns {string} 返回地址
     */
    GetDefaultUrl(urls) {
        let indexUrl = this.myWebBook.IndexUrl[this.myWebBook.defaultIndex];
        let hostName = SiteHelper.GetHost(indexUrl);

        for (let u of urls) {
            if (u.Path.includes(hostName)) return u.Path;
        }

        return urls[0]?.Path;
    }

    /**
     * 设置网文是否允许自动更新
     * 自动更新将在系统闲时，后台静默更新。若设置为启用，将同时将该书的空章节在更新队列安排到队首
     * @param {number} bookid 
     * @param {boolean} autoSyncEnabled 
     */
    static async SetAutoSync(bookid, autoSyncEnabled) {
        return DO.WebBookSetAutoSync(bookid, autoSyncEnabled);
    }

}