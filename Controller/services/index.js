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
            new ApiResponse(result.result, result.error, 20000, result.status).toCTX(ctx);
        });
    },
});