const fs = require("fs");
const path = require("path")
const ApiResponse = require("../../Entity/ApiResponse");
const { parseJsonFromBodyData } = require("./../../Core/Server");
const { saveUserConfig } = require("./../../Core/services/config");

//获取静态资源文件
module.exports = () => ({

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
        const { config: myConfig } = require("../../Core/services/config");
        const { dataPath, databasePath } = myConfig;
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
        const { config: myConfig } = require("../../Core/services/config");
        const { dataPath, FOLDER } = myConfig;
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
        const { config: myConfig } = require("../../Core/services/config");
        const { dataPath, FOLDER } = myConfig;
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
        const { config: myConfig } = require("../../Core/services/config");
        const { dataPath, FOLDER } = myConfig;
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
        const { latestConfig } = require("../../Core/services/config");
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

});