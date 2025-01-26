const socketIO = require('socket.io');
const EventManager = require("./EventManager");
const WorkerPool = require("./Worker/WorkerPool");

let myIO = null;
let myEM = null;

class SocketIO {
  constructor(server) {
    if (myIO != null) return this.GetIO("☠️");

    myEM = new EventManager();

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

    myEM.emit("Debug.Model.Init.Finish", "SocketIO");
    return myIO;
  }

  static GetIO(callerFile) {
    console.assert(myIO !== null, "需要先初始化好Socket服务才能取得对应实例！", callerFile);//
    return myIO;
  }

  /**
   * 初始化爬书相关的消息转发
   * @returns 
   */
  initEM_WebBook() {
    if (myEM == null) return;
    // myEM.on("WebBook.UpdateIndex.Finish", (bookid) => {
    //   // console.log("目录更新完毕！！");
    // })

    myEM.on("WebBook.UpdateOneChapter.Finish", (bookid, cId, title) => {
      myIO.emit(`WebBook.Chapter.Update.${bookid}`, {
        status: true,
        title,
        chapterId: cId,
        bookid
      });
    });

    myEM.on("WebBook.UpdateOneChapter.Error", (bookid, chapterId, err, jobId) => {
      myIO.emit(`WebBook.UpdateOneChapter.Error.${bookid}`, { bookid, chapterId, err: { name: err.name, message: err.message } });
      if (jobId) myEM.emit(`WebBook.UpdateOneChapter.Error_${jobId}`, bookid, chapterId, err);//分发给当前任务进程
    })

    myEM.on("WebBook.UpdateChapter.Process", (bookid, chapterId, rate, ok, fail, all) => {
      myIO.emit(`WebBook.UpdateChapter.Process.${bookid}`, { bookid, chapterId, rate, ok, fail, all })
    });

    myEM.on("WebBook.UpdateChapter.Finish", (bookid, bookName, chapterIndexArray, doneNum, failNum) => {
      myIO.emit(`WebBook.UpdateChapter.Finish.${bookid}`, { bookid, bookName, chapterIndexArray, doneNum, failNum });
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
      }, 1000);
    });

    //监听线程池唤醒
    socket.on("WorkerPool.Status.WakeUp", (socket) => {
      lastWakeUp = Date.now();
    });

    //监听线程池关闭
    socket.on("WorkerPool.Status.Off", (socket) => {
      disConnect();
    });
  }
}

module.exports = SocketIO; 