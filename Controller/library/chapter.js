const DO = require("../../Core/OTO/DO");
const BookMaker = require('../../Core/Book/BookMaker');
const ApiResponse = require("./../../Entity/ApiResponse");
const { parseJsonFromBodyData } = require("./../../Core/Server");

module.exports = () => ({
    prefix: '/library/book',
    /**
     * @swagger
     * /library/book/chapter:
     *   get:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 【章】根据章节ID获取章节正文
     *     description: 根据章节ID获取章节正文
     *     parameters:
     *     - name: chapterid
     *       in: query
     *       required: true
     *       description: 需获取的章节ID
     *       schema:
     *         type: integer
     *         format: int64
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "get ": async (ctx) => {
        let chapterId = ctx.query.chapterid;
        if (chapterId * 1 != chapterId) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }

        new ApiResponse(await DO.GetEBookChapterById(chapterId * 1)).toCTX(ctx);
    },

    /**
     * @swagger
     * /library/book/chapter/adjacent:
     *   get:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 【章】拿到上下章节的信息
     *     description: 拿到上一章、下一章的章节ID
     *     parameters:
     *     - name: chapterid
     *       in: query
     *       required: true
     *       description: 当前的章节ID
     *       schema:
     *         type: integer
     *         format: int64
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "get /adjacent": async (ctx) => {
        let chapterId = ctx.query.chapterid;
        if (chapterId * 1 != chapterId) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }

        new ApiResponse(await DO.GetEBookChapterNext(chapterId * 1)).toCTX(ctx);
    },


    /**
     * @swagger
     * /library/book/chapter:
     *   post:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 【章】新增/修改指定章节内容
     *     description: 提供章节ID则修改对应内容，仅提供书籍ID则新增对应章节
     *     parameters:
     *     - name: chapter
     *       in: body
     *       required: true
     *       description: 章节详情
     *       schema:
     *         type: object
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "post ": async (ctx) => {
        let chapter = await parseJsonFromBodyData(ctx);
        let chapterId = chapter.IndexId * 1;

        if (!chapter.Content && !chapter.Title) {       //如果同时没有内容和标题，直接返回
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }

        if (chapterId <= 0 && chapter.BookId > 0) {       //新增章节
            new ApiResponse(await DO.AddChapter(chapter)).toCTX(ctx);
            return;
        } else if (chapterId > 0) {      //修改章节
            new ApiResponse(await DO.UpdateChapter(chapter)).toCTX(ctx);
            return;
        }
        new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
    },

    /**
     * @swagger
     * /library/book/chapter/order:
     *   patch:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 【章】调整章节顺序
     *     description: 修改章节顺序
     *     parameters:
     *       - in: body
     *         name: chapterOrder
     *         description: 章节顺序
     *         schema:
     *           type: array
     *           items:
     *             type: object
     *             properties:
     *               indexId:
     *                 type: number
     *               newOrder:
     *                 type: number
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     */
    "patch /order": async (ctx) => {
        let param = await parseJsonFromBodyData(ctx);
        if (!param) return;

        new ApiResponse(await DO.UpdateChapterOrder(param)).toCTX(ctx);
    },

    /**
     * @swagger
     * /library/book/chapter/listhidden:
     *   get:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 【章】找到指定书下面已隐藏的章节
     *     description: 找到指定书下面已隐藏的章节，如简介等
     *     parameters:
     *     - name: bookid
     *       in: query
     *       required: true
     *       description: 需要获取的书ID
     *       schema:
     *         type: integer
     *         format: int64
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "get /listhidden": async (ctx) => {
        const bookid = ctx.query.bookid;
        if (bookid * 1 != bookid) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }

        new ApiResponse(await DO.GetEbookHiddenChapterList(bookid * 1)).toCTX(ctx);
    },

    /**
     * @swagger
     * /library/book/chapter/toggleHide:
     *   patch:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 【章】切换章节是否隐藏
     *     description: 切换章节是否隐藏，设置隐藏状态为当前状态的反转
     *     parameters:
     *       - in: body
     *         name: chapterId
     *         description: 需要设置的章节ID
     *         schema:
     *           type: integer
     *           format: int64
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     */
    "patch /toggleHide": async (ctx) => {
        let param = await parseJsonFromBodyData(ctx, ["chapterId"]);
        if (!param) return;

        try {
            new ApiResponse(await BookMaker.ToggleAChapterHide(param.chapterId)).toCTX(ctx);
        } catch (err) {
            new ApiResponse(null, `操作失败: ${err.message}`, 50000).toCTX(ctx);
        }
    },

    /**
     * @swagger
     * /library/book/chapter:
     *   delete:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 【章】删除指定章节
     *     description: 删除章节
     *     parameters:
     *     - name: chapterid
     *       in: query
     *       required: true
     *       description: 需删除的章节ID
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
        let chapterId = ctx.query.chapterid;
        if (chapterId * 1 != chapterId) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }

        new ApiResponse(await BookMaker.DeleteAChapter(chapterId)).toCTX(ctx);
    },

    /**
     * @swagger
     * /library/book/chapter/restructure:
     *   patch:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 【章】章节重组操作
     *     description: 对书籍章节进行结构调整（拆分、合并、批量更新/删除）
     *     parameters:
     *     - name: body
     *       in: body
     *       required: true
     *       schema:
     *         type: object
     *         properties:
     *           bookId:
     *             type: integer
     *             format: int64
     *           baseChapter:
     *             type: object
     *             description: 基准章节（用于拆分/合并定位）。使用基准章节可令后续章节排序序号后移。若不使用则可作为批量更新接口。
     *             properties:
     *               chapterId:
     *                 type: integer
     *                 format: int64
     *               content:
     *                 type: string
     *               orderNum:
     *                 type: integer
     *               title:
     *                 type: string
     *           operations:
     *             type: array
     *             description: 操作指令集
     *             items:
     *               type: object
     *               required: [operationType, chapters]
     *               properties:
     *                 operationType:
     *                   type: string
     *                   enum: [update, delete, create]
     *                 chapters:
     *                   type: array
     *                   description: 当operationType为delete时，chapters类型为数字数组
     *                   items:
     *                     type: object
     *                     properties:
     *                       chapterId:
     *                         type: integer?
     *                         format: int64
     *                       content:
     *                         type: string?
     *                       orderNum:
     *                         type: integer?
     *                       title:
     *                         type: string?
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 重组操作结果
     *       600:
     *         description: 无效的操作参数
     */
    "patch /restructure": async (ctx) => {
        const param = await parseJsonFromBodyData(ctx, ["bookId"]);
        if (!param) return;

        try {
            const results = await BookMaker.RestructureChapters(param);
            new ApiResponse(results).toCTX(ctx);
        } catch (error) {
            new ApiResponse(null, `批量操作失败: ${error.message}`, 50000).toCTX(ctx);
        }
    },

    /**
     * @swagger
     * /library/book/chapter/tointroduction:
     *   post:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 【章】转换章节为书籍简介
     *     description: 将指定章节内容设置为书籍简介
     *     parameters:
     *     - name: body
     *       in: body
     *       required: true
     *       schema:
     *         type: object
     *         required: [chapterId]
     *         properties:
     *           chapterId:
     *             type: integer
     *             format: int64
     *             description: 需要转换的章节ID
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 转换成功
     *       600:
     *         description: 参数错误（缺少章节ID或格式错误）
     *       500:
     *         description: 服务器内部错误
     */
    "post /tointroduction": async (ctx) => {
        const param = await parseJsonFromBodyData(ctx, ["chapterId"]);
        const chapterId = param.chapterId * 1;

        try {
            const results = await BookMaker.Chapter2Introduction(chapterId);
            new ApiResponse(results).toCTX(ctx);
        } catch (error) {
            new ApiResponse(null, `转化章节为书籍简介失败: ${error.message}`, 50000).toCTX(ctx);
        }
    },
});