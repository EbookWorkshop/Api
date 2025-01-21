const DO = require("../../Core/OTO/DO");
const ApiResponse = require("./../../Entity/ApiResponse");

module.exports = () => ({
    /**
     * @swagger
     * /library/bookmark:
     *   get:
     *     tags:
     *       - Library - Bookmark —— 图书馆书签
     *     summary: 取得书签
     *     description: 取得书签（全部/指定书籍）
     *     parameters:
     *     - name: bookid
     *       in: query
     *       required: false
     *       description: 取某书/全部书的书签
     *       schema:
     *         type: integer
     *         format: int64
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     */
    "get /bookmark": async (ctx) => {
        let bookid = ctx.query.bookid * 1;//允许空

        new ApiResponse(await DO.GetBookmark(bookid * 1)).toCTX(ctx);
    },

    /**
     * @swagger
     * /library/bookmark:
     *   post:
     *     tags:
     *       - Library - Bookmark —— 图书馆书签
     *     summary: 添加书签
     *     description: 添加书签
     *     parameters:
     *     - name: chapterid
     *       in: query
     *       required: true
     *       description: 给当前章节添加书签
     *       schema:
     *         type: integer
     *         format: int64
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     */
    "post /bookmark": async (ctx) => {
        let param = await Server.parseJsonFromBodyData(ctx, ["chapterid"]);
        if (!param) return;

        new ApiResponse(await DO.AddBookmark(param.chapterid * 1)).toCTX(ctx);
    },

    /**
     * @swagger
     * /library/bookmark:
     *   delete:
     *     tags:
     *       - Library - Bookmark —— 图书馆书签
     *     summary: 删除书签
     *     description: 删除书签
     *     parameters:
     *     - name: id
     *       in: query
     *       required: true
     *       description: 将要删除的书签id
     *       schema:
     *         type: integer
     *         format: int32
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     */
    "delete ": async (ctx) => {
        let id = ctx.query.id;
        if (id * 1 != id) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }

        new ApiResponse(await DO.DelBookmark(id)).toCTX(ctx);
    },
});