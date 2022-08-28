const EventManager = require("../Core/EventManager.js");
const DB = require("../Core/OTO/DatabaseHelper.js");


module.exports = new Promise((resolve, reject) => {
    try {

        const db = new DB();        //启用数据库
        const em = new EventManager();    //启用消息管理
        //koa app？

        em.once("DB.Models.Init", () => {
            console.log("数据库表已初始化");
            resolve();
        });
    } catch (err) {
        reject(err);
    }
});