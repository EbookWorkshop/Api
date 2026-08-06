import ApiResponse from "../../Entity/ApiResponse.js";
import { parseJsonFromBodyData } from "../../Core/Server.js";
import SocketIO from "../../Core/Socket.js";
import Message from "../../Entity/Message.js";

const __filename = import.meta.filename;

export default {
    /**
     * @swagger
     * /services/debug/message:
     *   post:
     *     tags:
     *       - Services - 基础 —— 系统服务：🐞调试
     *     summary: 向前端广播消息-发送到消息盒子
     *     description: 用于调试前端的消息接收功能
     *     parameters:
     *       - in: body
     *         name: message
     *         description: 消息
     *         schema:
     *           type: object
     *           required:
     *             - content          // 仅 content 为必填
     *           properties:
     *             title:
     *               type: string
     *               default: "调试消息"
     *               description: 消息标题
     *             subTitle:
     *               type: string
     *               default: "子标题示例"
     *               description: 子标题
     *             content:
     *               type: string
     *               default: "这是一条测试消息内容"
     *               description: 消息正文（必填）
     *             type:
     *               type: string
     *               default: "notice"
     *               description: 消息类型：message | notice | history。其中notice会在前端显示一个弹出消息引起注意。
     *             time:
     *               type: string
     *               default: "2026-08-03 12:00:00"
     *               description: 时间，格式如 "YYYY-MM-DD HH:mm:ss"缺省为当前时间
     *             avatar:
     *               type: string
     *               default: "/logo.svg?msg_logo_mark=1"
     *               description: 为图片时直接显示图片，为error/info时是对应图标，为index时则为当前队列的排序号
     *             id:
     *               type: number
     *               default: -123456
     *               description: 消息ID，不传则随机生成，负数为仅前端数据。正数ID将尝试从后台获取消息其它信息（Data、Error等）
     *             status:
     *               type: number
     *               default: 0
     *               description: 状态：0未读、1已读
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
     *       - Services - 基础 —— 系统服务：🐞调试
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
    // /**
    //  * @swagger
    //  * /services/debug/epub:
    //  *   get:
    //  *     tags:
    //  *       - Services - 基础 —— 系统服务：🐞调试
    //  *     summary: 临时测试入口
    //  *     description: 临时测试系统功能
    //  *     consumes:
    //  *       - application/json
    //  *     responses:
    //  *       200:
    //  *         description: 请求成功
    //  *       500:
    //  *         description: 请求失败
    //  */
    // "get /epub": async (ctx) => {
    //     const EPUB = require("epub-gen");

    //     const options = {
    //         title: "示例书籍",
    //         author: "作者名",
    //         publisher: "出版社",
    //         cover: "https://www.alice-in-wonderland.net/wp-content/uploads/1book1.jpg",
    //         content: [
    //             { title: "第一章", data: "<div>这是第一章内容</div>" },
    //             { title: "第二章", data: "<div>这是第二章内容</div>" }
    //         ]
    //     };

    //     new EPUB(options, "output.epub").promise.then(
    //         () => new ApiResponse("Ebook Generated Successfully!").toCTX(ctx),
    //         err => new ApiResponse(err,"Failed to generate Ebook",50000).toCTX(ctx)
    //     );
    // },

};