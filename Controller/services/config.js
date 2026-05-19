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