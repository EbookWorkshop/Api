const EventManager = require("../Core/EventManager.js");
const DB = require("../Core/OTO/DatabaseHelper.js");
const WP = require("./Worker/WorkerPool.js");

const { debug: isDebug } = require("./../config").config;

if (isDebug) {
    const debugEM = require("./debug");//载入Debug模块
}

module.exports = new Promise((resolve, reject) => {
    try {

        const wp = new WP();        //启用线程池
        const db = new DB();        //启用数据库
        const em = new EventManager();    //启用消息管理
        //koa app？

        //数据库初始化完成
        em.once("DB.Models.Init", () => {
            resolve();
        });
    } catch (err) {
        reject(err);
    }
});