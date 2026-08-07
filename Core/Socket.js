import { isMainThread } from'node:worker_threads';
if (!isMainThread) console.warn("!!!注意!!!尝试在子线程中使用单例模块[SocketIO]！子线程拥有独立的实例，共享数据、通讯等功能将失效。");

import { Server as socketIO } from "socket.io";
import EventManager from "./EventManager.js";
import Message from "../Entity/Message.js"
import WorkerPool from "./Worker/WorkerPool.js";
import MemoryCache from "./MemoryCache.js";

let myIO = null;

export default class SocketIO {
  /**
   * 
   * @param {KoaServer} server 
   * @returns 
   */
  constructor(server) {
    if (myIO != null) return this.GetIO("☠️");

    this.myEM = new EventManager();

    myIO = new socketIO(server, {
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
        console.log(`[${new Date().toLocaleString()}]\t收到消息：${msg}`);
      })
    });

    this.initEM_WebBook();
    this.initMessageBox();

    this.myEM.emit("Debug.Model.Init.Finish", "SocketIO");
    return myIO;
  }

  static GetIO(callerFile) {
    if (myIO == null) return { emit: (...x) => console.warn(callerFile + "\nSocket 尚未建立连接，未能发送消息：\n", ...x) };
    return myIO;
  }

  static SendMessage(message, data, error) {
    SocketIO.GetIO().emit(`Message.Box.Send`, message);
    MemoryCache.set(message.id, {
      type: error ? "ErrorMessage" : "",   //
      message: message, err: error, data: data
    });
  }

  static SendError(message, data, error) {
    SocketIO.GetIO().emit(`Message.Box.Send`, message);
    MemoryCache.set(message.id, {
      type: "ErrorMessage",
      message: message, err: error, data: data
    });
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

    this.myEM.on("WebBook.UpdateIndex.Finish", (bookid, bookName, data) => {
      myIO.emit(`Message.Box.Send`, new Message(`更新《${bookName}》目录完成，共新增${data.addChapterNum}章。`, "message", {
        id: -1 * Math.floor(Math.random() * 1000000),
        title: "更新目录完成",
        subTitle: `共新增${data.addChapterNum}章`,
      }));
    });

    this.myEM.on("WebBook.UpdateOneChapter.Finish", (bookid, cId, title) => {
      myIO.emit(`WebBook.Chapter.Update.${bookid}`, {
        status: true,
        title,
        chapterId: cId,
        bookid
      });
    });

    this.myEM.on("WebBook.UpdateOneChapter.Error", (bookid, chapterId, err, jobId, errObj) => {
      let msgId = -1;
      if (errObj) {
        const msg = new Message(err?.name || err, "message", { title: "更新章节失败" });

        errObj = Serialize.Error(errObj);
        MemoryCache.set(msg.id, {
          type: "ErrorMessage",
          message: msg, err: errObj, data: null
        });
        msgId = msg.id;
      }
      if (typeof (err) === "string") err = { name: err, message: err };

      myIO.emit(`WebBook.UpdateOneChapter.Error.${bookid}`, { bookid, chapterId, err: { ...err, ...errObj }, msgId });
      if (jobId) this.myEM.emit(`WebBook.UpdateOneChapter.Error_${jobId}`, bookid, chapterId, { ...err, ...errObj }, msgId);//分发给当前任务线程

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
        title: "书目录更新失败", subTitle: title, avatar: "error"
      });
      let showErr = err;
      if (JSON.stringify(err) === "{}") showErr = { message: err.message, stack: err.stack };//数据库抛出的错误序列化后为空，所以要手动添加

      SocketIO.SendMessage(msg, result ? Object.fromEntries(result) : result, showErr);
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

  /**
   * 初始化消息
   */
  initMessageBox() {
    this.myEM.on("MessageToUI", (message, data, error, isError) => {
      if (isError) SocketIO.SendError(message, data, error);
      else SocketIO.SendMessage(message, data, error);
    });
  }
}
