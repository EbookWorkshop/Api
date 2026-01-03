const fs = require("fs");
const path = require("path")
const myPackage = require("./../../package.json");
const ApiResponse = require("../../Entity/ApiResponse");
const { isSiteAccessible } = require("./../../Core/Utils/IsSiteAccesssible");
const { dataPath, databasePath } = require("../../config");

//获取静态资源文件
module.exports = () => ({
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
        let outdated = {};
        try {
            let fPath = path.resolve("./Entity/outdated.json");
            if (fs.existsSync(fPath)) {
                outdated = JSON.parse(fs.readFileSync(fPath, "utf8"));
            }
        } catch (_) { }

        let result = {
            version: myPackage.version,
            dependencies: myPackage.dependencies,
            nodeVersion: process.version, // 添加这一行来获取Node.js版本
            dataPath: path.resolve(dataPath),
            databaseSize: fs.statSync(databasePath).size,
            outdatedPackages: outdated
        }
        new ApiResponse(result).toCTX(ctx);
    },
});