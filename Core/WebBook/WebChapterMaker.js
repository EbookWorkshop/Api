
import path from "node:path";
import { config } from "../services/config.js";
import Message from "../../Entity/Message.js";
import DO from "../OTO/DO/index.js";
import EventManager from "../EventManager.js";
import RuleManager from "./RuleManager.js";
import WorkerPool from "../Worker/WorkerPool.js";
const wPool = WorkerPool.GetWorkerPool();


export default class WebChapterMaker {
    /**
     * 从网址抓取整篇文章
     * @param {*} url 文章地址
     */
    static async ScrapingFromUrl(url) {
        try {
            let fileName = await ScrapingFromUrl(url);

            //成功的输出
            new EventManager().SendErrorToUI(new Message(`已保存到库存中。来源网址：${url}`, "notice", {
                title: "已成功获取单章内容",
                subTitle: `文件：${fileName}`,
            }));
        } catch (error) {
            //出错的输出
            new EventManager().SendErrorToUI(new Message(error.message, "notice", {
                title: "获取单章内容失败",
                subTitle: "",
            }), Object.fromEntries(error));
        }
    }

    /**
     * 带守护的-从网址抓取整篇文章
     * @param {*} url 文章地址
     * @param {*} maxRetry 最大重试次数，-1为一直到成功/程序重启为止
     */
    static async ScrapingFromUrlOnWatch(url, maxRetry = -1) {
        setImmediate(async () => {
            if (maxRetry == 0) return await WebChapterMaker.ScrapingFromUrl(url);
            const MMT = 99999;
            let remainingAttempts = maxRetry == -1 ? MMT : maxRetry;

            while (remainingAttempts) {
                try {
                    let result = await ScrapingFromUrlOnWatch(url, remainingAttempts);

                    //成功的输出
                    new EventManager().SendErrorToUI(new Message(`已保存到库存中。\n共获取${result.page}页。\n失败重试：${result.tryTime}\n来源网址：${url}`, "notice", {
                        title: "已成功获取单章内容",
                        subTitle: `文件：${result.fileName}`,
                    }));
                    return;
                } catch (error) {
                    remainingAttempts--;
                }
            }

            if (remainingAttempts == 0) {//用完次数的退出
                //出错的输出
                new EventManager().SendErrorToUI(new Message(error.message, "notice", {
                    title: "获取单章内容失败",
                    subTitle: `以达到最大重试次数，已重试：${(maxRetry == -1 ? MMT : maxRetry)}`,
                }), Object.fromEntries(error));
            }
        });
    }
}

/**
 * 从网址抓取整篇文章
 * # 无输出
 * @param {*} url 文章地址
 * @param {*} webSetting 数据提取规则
 * @returns 存储的文件名
 */
async function ScrapingFromUrl(url, webSetting = null) {
    let { fileName } = await ScrapingFromUrlOnWatch(url, 0, webSetting);
    return fileName;
}

/**
 * 带重试的-从网址抓取整篇文章
 * @param {*} url 抓取地址
 * @param {*} maxRetry 最大重试次数 -1无限重试，0不重试
 * @param {*} webSetting 数据提取规则
 * @returns 存储的文件名
 */
async function ScrapingFromUrlOnWatch(url, maxRetry = -1, setting = null) {
    if (!setting) {
        const { chapter: ChapterRule, index: _, ...webSetting } = await RuleManager.GetRuleByURL(url);
        webSetting.RuleList = ChapterRule.GetRuleList();
        setting = webSetting;
    }
    let tryTime = 0;

    try {
        let result = await ScrapingOnePage(url, setting);
        let fileName = "临时任务" + (new Date()).toTimeString();
        if (result?.has("CapterTitle")) {
            fileName = result.get("CapterTitle")[0]?.text;
        }
        fileName = `${fileName}.txt`;

        let content = [];
        if (result?.has("Content")) {
            const contResult = result.get("Content");
            let [cContentResult, errObj, pageSources] = contResult;
            if (!cContentResult.text)  //爬内容失败
                throw new Error("抓取网页失败：", url);
            content.push(cContentResult.text);
        }

        if (result?.has("ContentNextPage")) {   //存在下一页
            let nextPageResult = result.get("ContentNextPage")[0];
            let nextPageUrl = url;
            // console.log("已获取：", nextPageUrl);
            while (nextPageResult.text?.includes(nextPageResult.Rule.CheckSetting)) {
                if (nextPageUrl == nextPageResult?.url) break;        //防止死循环
                nextPageUrl = nextPageResult.url;
                if (!nextPageUrl) break;

                try {
                    let tempResult = await ScrapingOnePage(nextPageUrl, setting);
                    if (!tempResult.get("Content")[0]?.text) {
                        throw new Error(`存在内容缺页，请重新抓取试试：${nextPageUrl}`);
                    }
                    content.push(tempResult.get("Content")[0].text);
                    // console.log("已获取：", nextPageUrl);
                    nextPageResult = tempResult.get("ContentNextPage")[0];
                } catch (err) {
                    if (maxRetry != -1) tryTime++;
                    if (maxRetry - tryTime == 0) throw err;
                    console.warn(`抓取网页内容失败，地址${nextPageUrl}\n正在重试，剩余重试次数：${maxRetry - tryTime}`);
                    nextPageUrl = "";//
                    await _sleep(30_000);
                }
            }
        }
        if (!content.length) throw new Error("抓取的最终结果为空！")

        //写到文件
        const { dataPath, FOLDER } = config;
        let savePath = path.join(dataPath, FOLDER.BookStorage, fileName);
        const { SaveFile } = await import("../services/file.mjs");
        await SaveFile(savePath, content.join("\n"));

        return {
            fileName,
            tryTime,
            page: content.length,
        };
    } catch (error) {
        //出错的输出
        throw error
    }

}
/**
 * 获取单页内容，并通过规则集提取目标内容
 * @param {*} url 
 * @param {*} setting 
 * @returns 
 */
async function ScrapingOnePage(url, setting) {
    console.assert(setting !== null)
    return await wPool.RunTaskAsync({
        taskfile: "@/Core/Utils/GetDataFromUrl/index.js",
        param: {
            url,
            setting: setting,
        },
        taskType: "puppeteer",
        maxThreadNum: 10
    }, async (result, err) => {
        if (!err) return result;
        throw err;
    });
}
/**
 * 休眠用，避免频繁调用目标地址导致被封
 * @param {*} time 
 * @returns 
 */
async function _sleep(time) { return new Promise((a, b) => setTimeout(a, time)); }
