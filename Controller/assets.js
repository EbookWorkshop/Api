const send = require('koa-send');//下载文件
const { config } = require("./../Core/services/config");
const path = require("path");
const ApiResponse = require("./../Entity/ApiResponse");

//获取静态资源文件
module.exports = () => ({
    /**
     * @swagger
     * /assets/download/{path}:
     *   get:
     *     tags:
     *       - Assets —— 资源管理
     *     summary: 下载文件
     *     description: 下载静态资源
     *     parameters:
     *     - name: path
     *       in: path
     *       required: true
     *       description: 资源路径
     *       schema:
     *         type: string
     *     consumes:
     *       - application/octet-stream
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 请求失败
     */
    "get /download/:path": async (ctx) => {
        //传入的相对路径
        let resPath = path.join(config.dataPath, ctx.params.path);
        console.debug("获取文件：", resPath);
        ctx.attachment(resPath);
        await send(ctx, ctx.params.path, { root: config.dataPath });
    },

    /**
     * @swagger
     * /assets/archive/book:
     *   get:
     *     tags:
     *       - Assets —— 资源管理
     *     summary: 获取库存图书列表
     *     description: 获取已库存图书列表
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 请求失败
     */
    "get /archive/book": async (ctx) => {
        const { ListFile } = require("./../Core/services/file.mjs");
        const bookDir = path.join(config.dataPath, config.FOLDER.BookStorage);
        const bookFiles = await ListFile(bookDir, { detail: true });

        new ApiResponse(bookFiles).toCTX(ctx);
    },

    /**
     * @swagger
     * /assets/archive/book/{name}:
     *   delete:
     *     tags:
     *       - Assets —— 资源管理
     *     summary: 删除图书
     *     description: 删除已库存的图书
     *     parameters:
     *     - name: name
     *       in: path
     *       required: true
     *       description: 图书文件名
     *       schema:
     *         type: string
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 请求失败
     */
    "delete /archive/book/:name": async (ctx) => {
        const { DeleteFile } = require("./../Core/services/file.mjs");
        const bookDir = path.join(config.dataPath, config.FOLDER.BookStorage);
        const bookPath = path.join(bookDir, ctx.params.name);
        const result = await DeleteFile(bookPath);

        new ApiResponse(result).toCTX(ctx);
    }
});