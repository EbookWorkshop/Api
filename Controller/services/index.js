const myPackage = require("./../../package.json");
const ApiResponse = require("../../Entity/ApiResponse");

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
        let result = {
            version: myPackage.version,
            dependencies: myPackage.dependencies
        }
        new ApiResponse(result).toCTX(ctx);
    },
});