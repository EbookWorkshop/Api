const socketIO = require('socket.io');
const EventManager = require("./EventManager");


let myIO = null;
let myEM = null;

class SocketIO {
  constructor(server) {
    if (myIO != null) return myIO;
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

    myEM = new EventManager();
    this.initEM_WebBook();

    // this.initEM_MessageTest();
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
        title: title,
        chapterId: cId,
        bookId: bookid
      })

    });
    myEM.on("WebBook.UpdateOneChapter.Error", (bookid, cId, err) => {
      // console.log(`更新章节失败：${bookid}-${cId}:`);
      // console.error(err);
    })

    myEM.on("WebBook.UpdateChapter.Process", (bookid, rate, ok, fail, all) => {
      myIO.emit("WebBook.UpdateChapter.Process", { bookid, rate, ok, fail, all })
    });

    myEM.on("WebBook.UpdateChapter.Finish", (bookid, chapterIndexArray, doneNum, failNum) => {
      myIO.emit("WebBook.UpdateChapter.Finish", {
        bookid, chapterIndexArray, doneNum, failNum
      })
    });
  }

  initEM_MessageTest() {
    setInterval(() => {
      myIO.emit("Notice.Debug", {
        message: "Socket 通信已建立"
      })
    }, 5000)
  }
}

module.exports = SocketIO; 