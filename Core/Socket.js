const socketIO = require('socket.io');
const EventManager = require("./EventManager");
const WorkerPool = require("./Worker/WorkerPool");
const Message = require("../Entity/Message.js");
const MemoryCache = require("./MemoryCache.js").getInstance();

let myIO = null;

class SocketIO {
  /**
   * 
   * @param {KoaServer} server 
   * @returns 
   */
  constructor(server) {
    if (myIO != null) return this.GetIO("☠️");

    this.myEM = new EventManager();

    myIO = socketIO(server, {
      cors: {
        origin: '*',//允许跨域
        methods: ['GET', 'POST'],
        //   allowedHeaders: ['my-custom-header'],
        credentials: true
      }
    });

    myIO.on("connection", (socket) => {
      this.initWorkerPool(socket);//设置监听消息
      socket.on("message", (msg) => {
        console.log("收到消息：", msg);
      })
    });

    this.initEM_WebBook();

    this.myEM.emit("Debug.Model.Init.Finish", "SocketIO");
    return myIO;
  }

  static GetIO(callerFile) {
    if (myIO == null) return { emit: (...x) => console.warn(callerFile + "\nSocket 尚未建立连接，未能发送消息：\n", ...x) };
    return myIO;
  }

  /**
   * 初始化爬书相关的消息转发
   * @returns 
   */
  initEM_WebBook() {
    if (this.myEM == null) return;
    this.myEM.on("WebBook.Create.Finish", (bookid, bookName) => {
      myIO.emit(`WebBook.Create.Finish`, { bookid, bookName });
    });

    this.myEM.on("WebBook.UpdateOneChapter.Finish", (bookid, cId, title) => {
      myIO.emit(`WebBook.Chapter.Update.${bookid}`, {
        status: true,
        title,
        chapterId: cId,
        bookid
      });
    });

    this.myEM.on("WebBook.UpdateOneChapter.Error", (bookid, chapterId, err, jobId) => {
      myIO.emit(`WebBook.UpdateOneChapter.Error.${bookid}`, { bookid, chapterId, err: { name: err.name, message: err.message || err } });
      if (jobId) this.myEM.emit(`WebBook.UpdateOneChapter.Error_${jobId}`, bookid, chapterId, err);//分发给当前任务线程
    })

    this.myEM.on("WebBook.UpdateChapter.Process", (bookid, chapterId, rate, ok, fail, all) => {
      myIO.emit(`WebBook.UpdateChapter.Process.${bookid}`, { bookid, chapterId, rate, ok, fail, all })
    });

    this.myEM.on("WebBook.UpdateChapter.Finish", (bookid, bookName, chapterIndexArray, doneNum, failNum) => {
      myIO.emit(`WebBook.UpdateChapter.Finish.${bookid}`, { bookid, bookName, chapterIndexArray, doneNum, failNum });
    });

    this.myEM.on("WebBook.UpdateIndex.Error", (err, url, result) => {
      const title = result === null ? "抓取目录线程执行失败" : "书目录更新回调执行失败";
      const msg = new Message(`执行请求：${url}\n错误信息：${err.message || err}`, "notice", {
        title: "书目录更新失败", subTitle: title
      });
      myIO.emit(`Message.Box.Send`, msg);
      MemoryCache.set(msg.id, {
        type: "ErrorMessage",
        message: msg, err, data: result
      });
    });
  }

  /**
   * 初始化线程池监控
   * @param {*} socket 连接的客户端
   */
  initWorkerPool(socket) {
    if (myIO == null) return;

    let intervalHandle = null;
    let lastWakeUp = 0;

    let disConnect = () => {
      if (myIO.engine.clientsCount > 0) {
        return;
      }

      if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
        lastWakeUp = 0;
      }
    }

    //监听线程池状态
    socket.on("WorkerPool.Status.On", (socket) => {
      if (intervalHandle) {
        lastWakeUp = Date.now();
        return;
      };
      intervalHandle = setInterval(() => {
        if (lastWakeUp > 0 && Date.now() - lastWakeUp > 5000) {
          disConnect();
          return;
        }
        let status = WorkerPool.GetStatus();
        myIO.emit("WorkerPool.Status", {
          type: "update",
          data: status,
          timestamp: Date.now()
        });
      }, 50);
    });

    //监听线程池唤醒
    socket.on("WorkerPool.Status.WakeUp", (socket) => {
      lastWakeUp = Date.now();
      // console.log("唤醒线程池");
    });

    //监听线程池关闭
    socket.on("WorkerPool.Status.Off", (socket) => {
      disConnect();
    });
  }
}

module.exports = SocketIO; 