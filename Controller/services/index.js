import fs from "node:fs";
import os from 'node:os';
import path from "node:path";
import myPackage from "../../package.json" with {type: "json"};
import ApiResponse from "../../Entity/ApiResponse.js"
import { isSiteAccessible } from "../../Core/Utils/IsSiteAccesssible.js";
import { config } from "../../Core/services/config.js";
import MemoryCache from "../../Core/MemoryCache.js";
import DB from "../../Core/OTO/DatabaseHelper.js";

const { dataPath, databasePath } = config;
export default {
    /**
     * @swagger
     * /services/version:
     *   get:
     *     tags:
     *       - Services - 基础 —— 系统服务：基础
     *     summary: 获取系统版本信息
     *     description: 获取系统版本等信息
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 请求失败
     */
    "get /version": async (ctx) => {
        let version = {};
        try {
            let fPath = path.resolve("./Entity/version.json");
            if (fs.existsSync(fPath)) {
                version = JSON.parse(fs.readFileSync(fPath, "utf8"));
            }

            let result = {
                version: myPackage.version,
                packageVersion: version,
                dataPath: path.resolve(dataPath),
                databaseSize: fs.statSync(databasePath).size,
                nodeVersion: process.version, // 添加这一行来获取Node.js版本
                osType: os.type(),
                osRelease: os.release(),
                cpu: os.cpus(),
                memFree: (os.freemem() / 1024 / 1024 / 1024).toFixed(2),
                memTotal: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2),
            }
            new ApiResponse(result).toCTX(ctx);
        } catch (_) { }

    },
    /**
     * @swagger
     * /services/checkSiteAccessibility:
     *   get:
     *     tags:
     *       - Services - 基础 —— 系统服务：基础
     *     summary: 检查站点是否可以访问
     *     description: 检查站点是否可以访问
     *     parameters:
     *     - name: host
     *       in: query
     *       required: true
     *       description: 站点的host标识
     *       schema:
     *         type: string
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "get /checkSiteAccessibility": async (ctx) => {
        let host = ctx.query.host;
        await isSiteAccessible(host).then((result) => {
            new ApiResponse(result, "", 20000, result.status).toCTX(ctx);
        });
    },

    /**
     * @swagger
     * /services/message:
     *   get:
     *     tags:
     *       - Services - 基础 —— 系统服务：基础
     *     summary: 获取消息
     *     description: 获取消息
     *     parameters:
     *     - name: msgid
     *       in: query
     *       required: true
     *       description: 消息id
     *       schema:
     *         type: number
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "get /message": (ctx) => {
        let msgid = ctx.query.msgid * 1;
        let msg = MemoryCache.get(msgid);
        if (msg) {
            new ApiResponse(msg).toCTX(ctx);
        } else {
            new ApiResponse(null, "消息不存在或已过期", 60000).toCTX(ctx);
        }
    },

    /**
     * @swagger
     * /services/compress_db:
     *   post:
     *     tags:
     *       - Services - 基础 —— 系统服务：基础
     *     summary: 压缩数据库
     *     description: 压缩数据库
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 请求失败
     */
    "post /compress_db": async (ctx) => {
        let result = await DB.Compress();
        new ApiResponse(result).toCTX(ctx);
    }
};