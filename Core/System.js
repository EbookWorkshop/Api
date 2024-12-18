const EventManager = require("./EventManager");
const DB = require("./OTO/DatabaseHelper");
const WP = require("./Worker/WorkerPool");
const IO = require("./Socket");


const { debug: isDebug } = require("./../config").config;

if (isDebug) {
    const debugEM = require("./debug");//载入Debug模块
}

module.exports = new Promise((resolve, reject) => {
    try {

        const em = new EventManager();    //启用消息管理
        em.emit("Debug.Model.Init.Start", "WorkerPool");
        const wp = new WP();        //启用线程池
        em.emit("Debug.Model.Init.Start", "DatabaseHelper");
        const db = new DB();        //启用数据库
        em.emit("Debug.Model.Init.Start", "SocketIO");
        const io = IO;        //
        //koa app？

        //数据库初始化完成
        em.once("DB.Models.Init", () => {
            resolve({
                wp, db, em, io
            });
        });
    } catch (err) {
        reject(err);
    }
});