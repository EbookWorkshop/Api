const socketIO = require('socket.io');
const EventManager = require("./EventManager");


let myIO = null;
let myEM = null;

class SocketIO {
  constructor(server) {
    if (myIO != null) return myIO;
    myEM = new EventManager();
    this.initEM_WebBook();

    myIO = socketIO(server, {
      cors: {
        origin: '*',//允许跨域
        methods: ['GET', 'POST'],
        //   allowedHeaders: ['my-custom-header'],
        credentials: true
      }
    });

    myIO.on("connection", (socket) => {
      // console.log("客户端已上线",socket);

      socket.on("message", (msg) => {
        console.log("收到消息：", msg);
      })
    });

    myEM.emit("Debug.Model.Init.Finish", "SocketIO");
  }

  static GetIO() {
    console.assert(myIO !== null, "需要先初始化好Socket服务才能取得对应实例！");//
    return myIO;
  }

  initEM_WebBook() {
    if (myEM == null) return;
    myEM.on("WebBook.UpdateIndex.Finish", (bookid) => {
      // console.log("目录更新完毕！！");
    })

    myEM.on("WebBook.UpdateOneChapter.Finish", (bookid, cId, title) => {
      myIO.emit("WebBook.Chapter.Update", {
        status: true,
        title,
        chapterId: cId,
        bookid
      });
    });

    myEM.on("WebBook.UpdateOneChapter.Error", (bookid, chapterId, err, jobId) => {
      myIO.emit("WebBook.UpdateOneChapter.Error", { bookid, chapterId, err: { name: err.name, message: err.message } });
      if (jobId) myEM.emit(`WebBook.UpdateOneChapter.Error_${jobId}`, bookid, chapterId, err);//分发给当前任务进程
    })

    myEM.on("WebBook.UpdateChapter.Process", (bookid, chapterId, rate, ok, fail, all) => {
      myIO.emit("WebBook.UpdateChapter.Process", { bookid, chapterId, rate, ok, fail, all })
    });

    myEM.on("WebBook.UpdateChapter.Finish", (bookid, bookName, chapterIndexArray, doneNum, failNum) => {
      myIO.emit("WebBook.UpdateChapter.Finish", {
        bookid, bookName, chapterIndexArray, doneNum, failNum
      })
    });
  }
}

module.exports = SocketIO; 