const send = require('koa-send');//下载文件
const myConfig = require("./../config").config;
const path = require("path");

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
        let resPath = path.join(myConfig.dataPath, ctx.params.path);
        console.debug("获取文件：", resPath);
        ctx.attachment(resPath);
        await send(ctx, resPath);
    },
});