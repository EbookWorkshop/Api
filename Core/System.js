const EventManager = require("./EventManager");
const db = require("./OTO/DatabaseHelper");
const WP = require("./Worker/WorkerPool");
const IO = require("./Socket");

const { debug: isDebug } = require("./../config");

module.exports = new Promise((resolve, reject) => {
    try {

        const em = new EventManager();    //启用消息管理
        em.emit("Debug.Model.Init.Start", "WorkerPool");
        const wp = new WP();        //启用线程池
        // em.emit("Debug.Model.Init.Start", "DatabaseHelper");
        em.emit("Debug.Model.Init.Start", "SocketIO");
        const io = IO;        //

        //数据库初始化完成
        em.once("DB.Models.Init", () => {
            resolve({
                wp, db, em, io,
                next: () => {
                    if (isDebug) require("./debug");//载入Debug模块

                    wp.RunTask({ taskfile: "@/Core/Utils/CreateOutdatedInfo.js" });//创建过时的包信息
                }
            });
        });
    } catch (err) {
        reject(err);
    }
});