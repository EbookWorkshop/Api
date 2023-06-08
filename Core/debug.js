//主要是辅助除错 开启一些监听
const EventManager = require("../Core/EventManager.js");


module.exports = (() => {
    const em = new EventManager();


    em.on("WebBook.UpdateIndex.Finish", (bookid) => {
        console.log("目录更新完毕！！");
    })

    em.on("WebBook.UpdateChapter.Process", (bookid, rate) => {
        console.log(`正在更新中，当前进度${(rate * 100).toFixed(2)}%`);
    })

    em.on("WebBook.UpdateChapter.Finish", (bookid, chapterIndexArray, doneNum, failNum) => {
        console.log("已完成更新下列章节", chapterIndexArray);

        console.log(`已成功：${doneNum}；已失败：${failNum}`);
    })
    em.on("Debug.Puppeteer.OpenUrl", (url) => {
        console.log("开始访问URL:", url)
    });

    em.on("Services.EMail.Send.Success", (title, files, mailto, sender) => {
        console.log("邮件发送成功：", title, files, mailto);
    })
    em.on("Services.EMail.Send.Fail", (title, files, mailto, sender) => {
        console.log("邮件发送失败：", title, files, mailto);
    })

    //多线程模块相关调试信息
    em.on("WorkerPool.Init", ({ MaxThread, NowWorker, FreeWorker }) => {
        console.info(`[线程池]\t最大线程数：${MaxThread}\t已激活线程：${NowWorker}\t空闲线程：${FreeWorker}\n\t线程池初始化完成！`);
    });
    em.on("WorkerPool.Worker.Start", ({ MaxThread, NowWorker, FreeWorker, Id }) => {
        console.info(`[线程池]\t最大线程数：${MaxThread}\t已激活线程：${NowWorker}\t空闲线程：${FreeWorker}\n\t线程${Id}:已安排任务`);
    });
    em.on("WorkerPool.Worker.Done", ({ MaxThread, NowWorker, FreeWorker, Id }) => {
        console.info(`[线程池]\t最大线程数：${MaxThread}\t已激活线程：${NowWorker}\t空闲线程：${FreeWorker}\n\t线程${Id}:已完成任务`);
    });
    em.on("WorkerPool.Worker.Error", ({ MaxThread, NowWorker, FreeWorker, Id, err }) => {
        console.info(`[线程池]\t最大线程数：${MaxThread}\t已激活线程：${NowWorker}\t空闲线程：${FreeWorker}\t线程${Id}:运行出错：`);
        console.error(err);
    });


    em.on("Debug.Log", (message) => {
        console.info(message);
    });
    em.emit("Debug.Log", "🪲🐞🐛已载入Debug模块！！")
})();