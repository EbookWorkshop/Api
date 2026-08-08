import fs from "node:fs";
import path from "node:path";
import ApiResponse from "../../Entity/ApiResponse.js";
import { parseJsonFromBodyData } from "../../Core/Server.js";
import { saveUserConfig } from "../../Core/services/config.js";
import { latestConfig } from "../../Core/services/config.js";
import SystemConfigService from "../../Core/services/SystemConfig.js";
import { GetNextWorkInfo } from "../../Core/Worker/AutoWork/GetWebBook.js";
import WorkerPool from "../../Core/Worker/WorkerPool.js";

//获取静态资源文件
export default {
    /**
     * @swagger
     * /services/config/datasetting:
     *   get:
     *     tags:
     *       - Services - 配置 —— 系统服务：配置
     *     summary: 获取数据集配置
     *     description: 获取数据集配置
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 请求失败
     */
    "get /datasetting": async (ctx) => {
        const { dataPath, databasePath } = latestConfig();
        new ApiResponse({
            dataPath,
            dataPathAbsolute: path.resolve(dataPath),
            databasePath,
            databasePathAbsolute: path.resolve(databasePath),
        }).toCTX(ctx);
    },


    /**
     * @swagger
     * /services/config/inventory:
     *   get:
     *     tags:
     *       - Services - 配置 —— 系统服务：配置
     *     summary: 获取库存配置
     *     description: 获取库存配置
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 请求失败
     */
    "get /inventory": async (ctx) => {
        const { dataPath, FOLDER } = latestConfig();
        new ApiResponse({
            path: path.join(dataPath, FOLDER.BookStorage),
            pathAbsolute: path.resolve(path.join(dataPath, FOLDER.BookStorage)),
        }).toCTX(ctx);
    },

    /**
     * @swagger
     * /services/config/cover:
     *   get:
     *     tags:
     *       - Services - 配置 —— 系统服务：配置
     *     summary: 获取封面配置
     *     description: 获取封面配置
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 请求失败
     */
    "get /cover": async (ctx) => {
        const { dataPath, FOLDER } = latestConfig();
        new ApiResponse({
            path: path.join(dataPath, FOLDER.BookCover),
            pathAbsolute: path.resolve(path.join(dataPath, FOLDER.BookCover)),
        }).toCTX(ctx);
    },

    /**
     * @swagger
     * /services/config/temp:
     *   get:
     *     tags:
     *       - Services - 配置 —— 系统服务：配置
     *     summary: 获取临时文件配置
     *     description: 获取临时文件配置
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 请求失败
     */
    "get /temp": async (ctx) => {
        const { dataPath, FOLDER } = latestConfig();
        new ApiResponse({
            tempPath: path.join(dataPath, FOLDER.TempFile),
            tempPathAbsolute: path.resolve(path.join(dataPath, FOLDER.TempFile)),

            outputPath: path.join(dataPath, FOLDER.TempBookOutput),
            outputPathAbsolute: path.resolve(path.join(dataPath, FOLDER.TempBookOutput)),

        }).toCTX(ctx);
    },

    /**
     * @swagger
     * /services/config/debug:
     *   get:
     *     tags:
     *       - Services - 配置 —— 系统服务：配置
     *     summary: 获取调试配置
     *     description: 获取调试配置
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 请求失败
     */
    "get /debug": async (ctx) => {
        const myConfig = latestConfig();
        new ApiResponse({ debug: myConfig.debug, debugSwitcher: myConfig.debugSwitcher }).toCTX(ctx);
    },

    /**
     * @swagger
     * /services/config/debug:
     *   patch:
     *     tags:
     *       - Services - 配置 —— 系统服务：配置
     *     summary: 设置调试配置
     *     description: 设置调试配置
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 请求失败
     */
    "patch /debug": async (ctx) => {
        let setting = await parseJsonFromBodyData(ctx);
        if (!setting) return;

        if (typeof setting.debug !== "undefined") {
            let { debug, ...debugSwitcher } = setting;
            if (debugSwitcher) setting = { debug, debugSwitcher };
        } else {
            setting = { debugSwitcher: setting };
        }

        new ApiResponse(saveUserConfig(setting)).toCTX(ctx);
    },

    /**
     * @swagger
     * /services/config/autoworker:
     *   get:
     *     tags:
     *       - Services - 配置 —— 系统服务：配置
     *     summary: 自动任务的相关配置
     *     description: 自动任务的相关配置
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 请求失败
     */
    "get /autoworker": async (ctx) => {
        new ApiResponse({
            runInterval: await SystemConfigService.getConfig(SystemConfigService.Group.SYSTEM_AUTO_WORKER, "run_interval") * 1 || 0,
            nextWork: await GetNextWorkInfo(),
        }).toCTX(ctx);
    },

    /**
     * @swagger
     * /services/config/autoworker:
     *   patch:
     *     tags:
     *       - Services - 配置 —— 系统服务：配置
     *     summary: 自动任务的相关配置
     *     description: 自动任务的相关配置
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 请求失败
     */
    "patch /autoworker": async (ctx) => {
        let setting = await parseJsonFromBodyData(ctx);
        if (!setting) return;

        if (typeof setting.runInterval !== "undefined") {
            let { runInterval } = setting;
            SystemConfigService.setConfig(SystemConfigService.Group.SYSTEM_AUTO_WORKER, "run_interval", runInterval);
            const wp = new WorkerPool()
            wp.autoWorkInterval = runInterval;
            wp.isRunAutoWorker = runInterval > 0;
        }

        new ApiResponse().toCTX(ctx);
    },

};