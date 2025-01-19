const DO = require("./../../Core/OTO/DO");

const Server = require("./../../Core/Server");
const ApiResponse = require('../../Entity/ApiResponse');

module.exports = () => ({
    /**
     * @swagger
     * /library/ebooktag:
     *   get:
     *     tags:
     *       - Library - Tag —— 图书馆管理
     *     summary: 取得某书的标签
     *     description: 取得指定书的所有标签
     *     parameters:
     *     - name: bookid
     *       in: query
     *       required: true
     *       description: 需获取标签的书ID
     *       schema:
     *         type: integer
     *         format: int64
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     */
    "get /../ebooktag": async (ctx) => {
        let bookId = ctx.query.bookid;
        if (bookId * 1 != bookId) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }

        let tags = await DO.GetTagById(bookId);
        new ApiResponse(tags).toCTX(ctx);
    },
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
        if (tagText == "") { new ApiResponse(null, `标签文本不能为空`, 60000).toCTX(ctx); return; }

        let [data, result] = await DO.AddTagForBook(bookid, tagText);

        new ApiResponse(data, null, result).toCTX(ctx);
    },
    /**
     * @swagger
     * /library/tag:
     *   delete:
     *     tags:
     *       - Library - Tag —— 图书馆管理
     *     summary: 取消某书的标签
     *     description: 给某书取消一个标签
     *     parameters:
     *     - name: bookid
     *       in: query
     *       required: true
     *       description: 需删除标签的书ID
     *       schema:
     *         type: integer
     *         format: int64
     *     - name: tagid
     *       in: query
     *       required: true
     *       description: 删除的标签Id
     *       schema:
     *         type: integer
     *         format: int64
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     */
    "delete ": async (ctx) => {

        var bookid = ctx.query.bookid * 1;      //标记的书
        var tagid = ctx.query.tagid * 1;      //需取消的标签Id
        if (!bookid || !tagid) { new ApiResponse(null, `参数错误`, 60000).toCTX(ctx); return; }

        let result = await DO.RemoveTagOnBook(bookid, tagid);

        new ApiResponse(null, null, result).toCTX(ctx);
    },
    /**
     * @swagger
     * /library/tag/list:
     *   get:
     *     tags:
     *       - Library - Tag —— 图书馆管理
     *     summary: 取得有记录的标签
     *     description: 标签如果有关联书籍，则会返回
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     */
    "get /list": async (ctx) => {

        let tags = await DO.GetTagList();
        console.log(tags);
        new ApiResponse(tags).toCTX(ctx);
    },



});