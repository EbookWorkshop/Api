//主要是辅助除错 开启一些监听
const EventManager = require("../Core/EventManager.js");


module.exports = (() => {
    const { debugSwitcher } = require("./../config");
    const em = new EventManager();

    if (debugSwitcher.database) {
        em.on("DB.Models.Init", (dbPath) => {
            let path = require("path");
            console.log("数据库模型初始化完成！！数据库存储路径：", path.resolve(dbPath));
        });
    }

    if (debugSwitcher.pdf) {
        em.on("PDFMaker.CreateBook.Finish", (fileInfo) => {
            console.log(`PDF文件制作成功：${fileInfo.filename}，存储路径：${fileInfo.path}`);
        });
        em.on("Debug.PDFMaker.MakePDF.Fail", (err, filename, path) => {
            console.error(`PDF文件制作失败：${filename}，存储路径：${path}`);
            console.error(err);
        })
    }

    if (debugSwitcher.bookIndex) {
        em.on("WebBook.UpdateIndex.Finish", (bookid) => {
            console.log("目录更新完毕！！");
        })
    }

    if (debugSwitcher.bookChapter) {
        em.on("WebBook.UpdateOneChapter.Error", (bookid, cId, err) => {
            console.log(`更新章节失败：${bookid}-${cId}:`);
            console.error(err);
        })

        em.on("WebBook.UpdateChapter.Process", (bookid, chapterId, rate, ok, fail, all) => {
            console.log(`正在更新中[${bookid}-${chapterId}]，当前进度${(rate * 100).toFixed(2)}%\n\t\t完成：${ok}\t失败：${fail}\t总数：${all}`);
        })
        em.on("WebBook.UpdateChapter.Finish", (bookid, bookName, chapterIndexArray, doneNum, failNum) => {
            console.log("已完成更新下列章节", chapterIndexArray);
            console.log(`《${bookName}》已成功：${doneNum}；已失败：${failNum}`);
        });
    }

    if (debugSwitcher.puppeteer) {
        em.on("Debug.Puppeteer.OpenUrl", (url) => {
            console.log("开始访问URL:", url)
        });
    }

    //监控模块装载情况
    if (debugSwitcher.init) {
        em.on("Debug.Model.Init.Start", (modelName) => {
            console.log(`[模块载入中…]：\t\t${modelName}`);
        })
        em.on("Debug.Model.Init.Finish", (modelName) => {
            console.log(`[模块载入完成]：\t${modelName}`);
        })
    }

    if (debugSwitcher.email) {
        em.on("Services.EMail.Send.Success", (title, files, mailto, sender) => {
            console.log("邮件发送成功：", title, files, mailto);
        })
        em.on("Services.EMail.Send.Fail", (title, files, mailto, sender) => {
            console.log("邮件发送失败：", title, files, mailto);
        })
    }

    //多线程模块相关调试信息
    if (debugSwitcher.workerPool) {
        em.on("WorkerPool.Init", ({ MaxThread, NowWorker, FreeWorker }) => {
            console.info(`[线程池]\t最大线程数：${MaxThread}\t已激活线程：${NowWorker}\t空闲线程：${FreeWorker}\n\t线程池初始化完成！`);
        });
        em.on("WorkerPool.Worker.Start", ({ MaxThread, NowWorker, FreeWorker, Id, Task }) => {
            console.info(`[线程池]\t最大线程数：${MaxThread}\t已激活线程：${NowWorker}\t空闲线程：${FreeWorker}\n\t线程${Id}:已安排任务:\t\t${Task}`);
        });
        em.on("WorkerPool.Worker.Done", ({ MaxThread, NowWorker, FreeWorker, Id, Task }) => {
            console.info(`[线程池]\t最大线程数：${MaxThread}\t已激活线程：${NowWorker}\t空闲线程：${FreeWorker}\n\t线程${Id}:已完成任务:\t\t${Task}`);
        });
        em.on("WorkerPool.Worker.Error", ({ MaxThread, NowWorker, FreeWorker, Id, Task, err }) => {
            console.info(`[线程池]\t最大线程数：${MaxThread}\t已激活线程：${NowWorker}\t空闲线程：${FreeWorker}\t线程${Id}:运行出错：\t\t${Task}`);
            console.error(err);
        });
    }

    //未分类的调试信息
    em.on("Debug.Log", (message, funName) => {
        switch (funName) {
            case "ROUTER": if (!debugSwitcher.router) return; break;
            case "BOOKINDEX": if (!debugSwitcher.bookIndex) return; break;
            case "BOOKCHAPTER": if (!debugSwitcher.bookChapter) return; break;
            default:
                break;
        }
        console.info(message);
    });
    em.emit("Debug.Log", "🪲🐞🐛已载入Debug模块！！")
})();