
const path = require("node:path");
const DO = require("../OTO/DO");
const RuleManager = require("./RuleManager");
const WorkerPool = require("../Worker/WorkerPool");
const { config } = require("../services/config");

const wPool = WorkerPool.GetWorkerPool();


class WebChapterMaker {
    /**
     * 从网址抓取整篇文章
     * @param {*} url 文章地址
     */
    static async ScrapingFromUrl(url) {
        const { chapter: ChapterRule, index: _, ...webSetting } = await RuleManager.GetRuleByURL(url);
        webSetting.RuleList = ChapterRule.GetRuleList();
        wPool.RunTask({
            taskfile: "@/Core/Utils/GetDataFromUrl",
            param: {
                url,
                setting: webSetting,
            },
            taskType: "puppeteer",
            maxThreadNum: 10
        }, async (result, err) => {
            //标题
            let title = "临时任务" + (new Date()).toTimeString();
            if (result?.has("CapterTitle")) {
                title = result.get("CapterTitle")[0]?.text;
            }
            let content = null;
            if (result?.has("Content")) {
                const contResult = result.get("Content");
                let [cContentResult, errObj, pageSources] = contResult;
                if (!cContentResult.text) { //爬内容失败
                    console.warn("抓取网页失败：", url);
                    return false;
                } else content = cContentResult.text;
            }

            if (result?.has("ContentNextPage")) {   //存在下一页
                let nextPageResult = result.get("ContentNextPage")[0];
                let nextPageUrl = url;
                while (nextPageResult.text?.includes(nextPageResult.Rule.CheckSetting)) {
                    if (nextPageUrl == nextPageResult?.url) break;        //防止死循环
                    nextPageUrl = nextPageResult.url;
                    if (!nextPageUrl) break;

                    let tempResult = await wPool.RunTaskAsync({
                        taskfile: "@/Core/Utils/GetDataFromUrl",
                        param: {
                            url: nextPageUrl,
                            setting: webSetting
                        },
                        taskType: "puppeteer",
                        maxThreadNum: 10,
                        highPriority: true,
                    });

                    if (!tempResult.get("Content")[0].text) {
                        console.warn("存在内容缺页，请重新抓取试试：", nextPageUrl, tempResult);
                        return false;
                    }
                    content += tempResult.get("Content")[0].text;
                    nextPageResult = tempResult.get("ContentNextPage")[0];
                }
            }

            //写到文件
            const { dataPath, FOLDER } = config;
            let savePath = path.join(dataPath, FOLDER.BookStorage, `${title}.txt`);
            const { SaveFile } = await import("../services/file.mjs");
            await SaveFile(savePath, content);
        });
    }
}

module.exports = WebChapterMaker;