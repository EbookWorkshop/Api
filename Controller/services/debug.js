const Server = require("./../../Core/Server");
const ApiResponse = require("../../Entity/ApiResponse");
const SocketIO = require("./../../Core/Socket.js");
const Message = require("../../Entity/Message");



//获取静态资源文件
module.exports = () => ({
    /**
     * @swagger
     * /services/debug/message:
     *   post:
     *     tags:
     *       - Services - 基础 —— 系统服务：调试
     *     summary: 向前端广播消息
     *     description: 用于调试前端的消息接收功能
     *     parameters:
     *       - in: body
     *         name: message
     *         description: 消息
     *         schema:
     *             type: object
     *             required:
     *               - files
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
        let param = await Server.parseJsonFromBodyData(ctx);
        if (param == null) return;
        SocketIO.GetIO(__filename).emit("Message.Box.Send", new Message(param.content, param.type, param));

        new ApiResponse(true).toCTX(ctx);
    },
});