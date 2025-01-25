const { parseJsonFromBodyData } = require("./../../Core/Server");
const ApiResponse = require("../../Entity/ApiResponse");
const SocketIO = require("./../../Core/Socket.js");
const Message = require("../../Entity/Message");

module.exports = () => ({
    /**
     * @swagger
     * /services/debug/message:
     *   post:
     *     tags:
     *       - Services - 基础 —— 系统服务：调试
     *     summary: 向前端广播消息-发送到消息盒子
     *     description: 用于调试前端的消息接收功能
     *     parameters:
     *       - in: body
     *         name: message
     *         description: 消息
     *         schema:
     *             type: object
     *             properties:
     *               title:
     *                 type: string
     *               subTitle:
     *                 type: string
     *               content:
     *                 type: string
     *               type:
     *                 type: string
     *               time:
     *                 type: string
     *               avatar:
     *                 type: string
     *               id:
     *                 type: number
     *               status:
     *                 type: number
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 请求失败
     */
    "post /message": async (ctx) => {
        let param = await parseJsonFromBodyData(ctx);
        if (param == null) return;
        SocketIO.GetIO(__filename).emit("Message.Box.Send", new Message(param.content, param.type, param));

        new ApiResponse(true).toCTX(ctx);
    },
    /**
     * @swagger
     * /services/debug/socket:
     *   post:
     *     tags:
     *       - Services - 基础 —— 系统服务：调试
     *     summary: 广播指定的socket消息
     *     description: 用于调试接收socket的模块的响应
     *     parameters:
     *       - in: body
     *         name: data
     *         description: socket 内容
     *         schema:
     *             type: object
     *             required:
     *               - message
     *             properties:
     *               message:
     *                 type: string
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 请求失败
     */
    "post /socket": async (ctx) => {
        let param = await parseJsonFromBodyData(ctx);
        if (param == null) return;
        SocketIO.GetIO(__filename).emit(param.message, param);

        new ApiResponse(true).toCTX(ctx);
    },

    /**
     * @swagger
     * /services/debug/test:
     *   get:
     *     tags:
     *       - Services - 基础 —— 系统服务：调试
     *     summary: 临时测试入口
     *     description: 临时测试系统功能
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 请求失败
     */
    "get /test": async (ctx) => {
        let DO = require("../../Core/OTO/DO");
        console.log(Object.getOwnPropertyNames(DO));
    },
});