const DO = require("./../../Core/OTO/DO");

const Server = require("./../../Core/Server");
const ApiResponse = require('../../Entity/ApiResponse');

module.exports = () => ({
    /**
     * @swagger
     * /library/tag:
     *   post:
     *     tags:
     *       - Library - Tag —— 图书馆管理
     *     summary: 为某书打上标签
     *     description: 给某书加上一个标签
     *     parameters:
     *       - in: body
     *         name: bookInfo
     *         description: 待打标签的书
     *         schema:
     *           type: object
     *           required:
     *             - bookId
     *             - tagText
     *           properties:
     *             bookId:
     *               type: integer
     *               format: int32
     *             tagText:
     *               type: string
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     */
    "post ": async (ctx) => {
        let param = await Server.parseJsonFromBodyData(ctx, ["bookId", "tagText"]);
        if (!param) return;

        var bookid = param.bookId;      //标记的书
        var tagText = param.tagText;    //标记文本
        tagText = tagText?.trim();
        if (tagText == "") new ApiResponse(null, `标签文本不能为空`, 60000).toCTX(ctx);

        
    },
});