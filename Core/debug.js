//主要是辅助除错 开启一些监听
const EventManager = require("../Core/EventManager.js");


module.exports = (() => {
    const em = new EventManager();


    em.on("WebBook.UpdateIndex.Finish", (bookid) => {
        console.log("目录更新完毕！！");
    })

    em.on("WebBook.UpdateChapter.Process", (bookid, rate) => {
        console.log(`正在更新中，当前进度${rate * 100}%`);
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

    em.on("Debug.Log", (message) => {
        console.warn(message);
    });
    em.emit("Debug.Log", "🪲🐞🐛已载入Debug模块！！")
})();