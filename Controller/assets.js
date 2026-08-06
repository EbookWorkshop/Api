import fs from "node:fs";
import path from "node:path";
import send from "koa-send";//下载文件
import ApiResponse from "../Entity/ApiResponse.js";
import { parseJsonFromBodyData } from "../Core/Server.js";
import { config } from "../Core/services/config.js";
import { ListFile,DeleteFile,RenameFile } from "../Core/services/file.mjs";


//获取静态资源文件
export default {
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
        // console.debug("获取文件：", resPath);
        ctx.attachment(resPath);
        await send(ctx, ctx.params.path, { root: config.dataPath });
    },


    /**
     * @swagger
     * /assets/view/{path}:
     *   get:
     *     tags:
     *       - Assets —— 资源管理
     *     summary: 查看文件
     *     description: 查看静态资源
     *     parameters:
     *     - name: path
     *       in: path
     *       required: true
     *       description: 资源路径
     *       schema:
     *         type: string
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 请求失败
     */
    "get /view/:path": async (ctx) => {
        //传入的相对路径
        let resPath = path.join(config.dataPath, ctx.params.path);
        // console.debug("查看文件：", resPath);
        const type = path.extname(resPath).toLowerCase();
        ctx.type = type;//可以直接设置文件类型，并自动推测mimetype。或者直接设置mimetype
        ctx.body = fs.createReadStream(resPath);
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
        const bookDir = path.join(config.dataPath, config.FOLDER.BookStorage);
        const bookFiles = await ListFile(bookDir, { detail: true });

        new ApiResponse(bookFiles).toCTX(ctx);
    },

    /**
     * @swagger
     * /assets/archive/book:
     *   post:
     *     tags:
     *       - Assets —— 资源管理
     *     summary: 修改库存图书信息
     *     description: 修改库存图书信息，修改文件名
     *     parameters:
     *       - in: body
     *         name: fileinfo
     *         description: 文件信息
     *         schema:
     *             type: object
     *             required:
     *               - file
     *               - name
     *             properties:
     *               file:
     *                 type: string
     *               name:
     *                 type: string
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     */
    "post /archive/book": async (ctx) => {
        let param = await parseJsonFromBodyData(ctx, ["file", "name"]);
        if (param == null) return;
        const bookDir = path.join(config.dataPath, config.FOLDER.BookStorage);
        const oldFile = path.join(bookDir, param.file);
        const ext = path.extname(param.file);
        const newName = path.join(bookDir, `${param.name}${ext}`);
        new ApiResponse(await RenameFile(oldFile, newName)).toCTX(ctx);
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
        const bookDir = path.join(config.dataPath, config.FOLDER.BookStorage);
        const bookPath = path.join(bookDir, ctx.params.name);
        const result = await DeleteFile(bookPath);

        new ApiResponse(result).toCTX(ctx);
    }
};