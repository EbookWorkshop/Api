const DO = require("./../../Core/OTO/DO");

const { parseJsonFromBodyData } = require("./../../Core/Server");
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
     *             - tagText
     *           properties:
     *             bookId:
     *               type: integer
     *               format: int32
     *             tagText:
     *               type: string
     *             color:
     *               type: string
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     */
    "post ": async (ctx) => {
        let param = await parseJsonFromBodyData(ctx, ["tagText"]);
        if (!param) return;
        var bookid = param.bookId;      //标记的书
        var tagText = param.tagText;    //标记文本
        tagText = tagText?.trim();
        if (tagText == "") { new ApiResponse(null, `标签文本不能为空`, 60000).toCTX(ctx); return; }

        if (bookid) {
            let [data, result] = await DO.AddTagForBook(bookid, tagText);
            new ApiResponse(data, null, result).toCTX(ctx);
        } else {
            let data = await DO.CreateTag(tagText, param.color);
            new ApiResponse(data).toCTX(ctx);
        }
    },
    /**
     * @swagger
     * /library/tag:
     *   patch:
     *     tags:
     *       - Library - Tag —— 图书馆管理
     *     summary: 修改某标签
     *     description: 修改现有的一个标签
     *     parameters:
     *       - in: body
     *         name: tagInfo
     *         description: 标签信息
     *         schema:
     *           type: object
     *           required:
     *             - tagId
     *           properties:
     *             tagId:
     *               type: integer
     *               format: int32
     *             tagText:
     *               type: string
     *             color:
     *               type: string
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     */
    "patch ": async (ctx) => {
        let param = await parseJsonFromBodyData(ctx, ["tagId"]);
        if (!param) return;

        if (param.tagId == 0) {
            new ApiResponse(null, `参数错误，缺失ID`, 60000).toCTX(ctx);
        }

        await DO.UpdateTag(param.tagId, param.tagText, param.color).then((result) => {
            new ApiResponse(result, result > 0 ? "成功" : "没有可更新数据", result > 0).toCTX(ctx);
        });
    },

    /**
     * @swagger
     * /library/tag:
     *   delete:
     *     tags:
     *       - Library - Tag —— 图书馆管理
     *     summary: 删除某个书签
     *     description: 删除某个书签，并删除所有书的关联记录
     *     parameters:
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
        var tagid = ctx.query.tagid * 1;
        if (!tagid) { new ApiResponse(null, `参数错误`, 60000).toCTX(ctx); return; }

        let result = await DO.DeleteTag(tagid);
        new ApiResponse(null, null, result).toCTX(ctx);
    },


    /**
     * @swagger
     * /library/tagonbook:
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
     *       description: 需取消标记的标签ID
     *       schema:
     *         type: integer
     *         format: int64
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     */
    "delete /../tagonbook": async (ctx) => {
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
     *     summary: 获取标签列表
     *     description: 获取标签列表，可以是全部标签，或只获取有标记到书上的标签
     *     parameters:
     *     - name: hasbook
     *       in: query
     *       required: false
     *       description: 这个书签是否需要有书引用
     *       schema:
     *         type: integer
     *         format: int64
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     */
    "get /list": async (ctx) => {
        let tagid = ctx.query.hasbook * 1;
        let tags = await DO.GetTagList(tagid > 0);
        new ApiResponse(tags).toCTX(ctx);
    },



});