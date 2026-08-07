import EventManager from "./EventManager.js"

import IO from "./Socket.js"
import db from "./OTO/DatabaseHelper.js";
import WP from "./Worker/WorkerPool.js";
import * as MemoryCache from "./MemoryCache.js"; // 引入内存缓存服务
import SystemConfigService from "./services/SystemConfig.js"; // 假设服务类位于 Services 目录
import packageJson from "../package.json" with {type: "json"}; // 指向项目根目录的 package.json
import { config } from "./services/config.js";

const { debug: isDebug } = config;
if (isDebug) import("./debug.js");//载入Debug模块要尽可能早，便于尽早监听错误信息

export default new Promise((resolve, reject) => {
    try {

        const em = new EventManager();    //启用消息管理

        em.emit("Debug.Model.Init.Start", "MemoryCache");
        const memoryCache = MemoryCache.getInstance();
        if (memoryCache) em.emit("Debug.Model.Init.Finish", "MemoryCache");

        em.emit("Debug.Model.Init.Start", "WorkerPool");
        const wp = new WP();        //启用线程池

        em.emit("Debug.Model.Init.Start", "SocketIO");
        const io = IO;        //启用SocketIO

        //数据库初始化完成
        em.once("DB.Models.Init", () => {
            resolve({
                wp, db, em, io,
                next: () => {
                    wp.RunTaskAsync({ taskfile: "@/Core/Utils/CreateOutdatedInfo.js" });//创建过时的包信息
                }
            });

            setImmediate(async () => {
                await initializeDatabase();
            });
        });
    } catch (err) {
        reject(err);
    }
});

/**
 * 数据库初始化-初始数据初始化
 */
async function initializeDatabase() {
    // 记录数据库初始化时使用的项目版本-便于跟踪后续升级
    const dbVersion = await SystemConfigService.getConfig(
        SystemConfigService.Group.DATABASE_VERSION,
        'create_version'
    );
    if (!dbVersion) {
        await SystemConfigService.setConfig(
            SystemConfigService.Group.DATABASE_VERSION,
            'create_version',
            packageJson.version
        );
    }
}

