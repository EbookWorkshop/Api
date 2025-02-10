const DO = require("../../Core/OTO/DO");
const BookMaker = require('../../Core/Book/BookMaker');
const ApiResponse = require("./../../Entity/ApiResponse");
const { parseJsonFromBodyData } = require("./../../Core/Server");

module.exports = () => ({
    /**
     * @swagger
     * /library/booklist:
     *   get:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 拿到所有书的信息
     *     description: 拿到所有书的信息
     *     parameters:
     *     - name: tagid
     *       in: query
     *       required: false
     *       description: 标签ID
     *       schema:
     *         type: integer
     *         format: int64
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 请求失败
     */
    "get /booklist": async (ctx) => {
        let tagid = ctx.query.tagid * 1;
        new ApiResponse(await DO.GetBookList(tagid)).toCTX(ctx);
    },

    /**
     * @swagger
     * /library/book:
     *   get:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 拿到指定ID的书
     *     description: 拿到指定ID的书
     *     parameters:
     *     - name: bookid
     *       in: query
     *       required: true
     *       description: 需获取的书ID
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
    "get /book": async (ctx) => {
        let bookId = ctx.query.bookid;
        if (bookId * 1 != bookId) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }

        new ApiResponse(await DO.GetEBookById(bookId * 1)).toCTX(ctx);
    },

    /**
     * @swagger
     * /library/book/chapter:
     *   get:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 根据章节ID获取章节正文
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
    "get /book/chapter": async (ctx) => {
        let chapterId = ctx.query.chapterid;
        if (chapterId * 1 != chapterId) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }

        new ApiResponse(await DO.GetEBookChapterById(chapterId * 1)).toCTX(ctx);
    },

    /**
     * @swagger
     * /library/book/adjacentchapter:
     *   get:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 拿到上下章节的信息
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
    "get /book/adjacentchapter": async (ctx) => {
        let chapterId = ctx.query.chapterid;
        if (chapterId * 1 != chapterId) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }

        new ApiResponse(await DO.GetEBookChapterNext(chapterId * 1)).toCTX(ctx);
    },

    /**
     * @swagger
     * /library/book:
     *   post:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 添加一本书
     *     description: 新书入库
     *     parameters:
     *     - name: book
     *       in: body
     *       required: true
     *       description: 书配置
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
    "post /book": async (ctx) => {
        let bookInfo = ctx.request.body;

        let rsl = false;
        if (bookInfo.type === "txt")
            rsl = await BookMaker.AddATxtBook({
                ...bookInfo,
                chapters: bookInfo.chapterList
            });

        ApiResponse.GetResult(rsl).toCTX(ctx);
    },
    /**
     * @swagger
     * /library/emptybook:
     *   post:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 添加一本空书
     *     description: 加入一本空书，不含任何章节
     *     parameters:
     *     - name: book
     *       in: body
     *       required: true
     *       description: 书配置
     *       schema:
     *         type: object
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     */
    "post /emptybook": async (ctx) => {
        let bookInfo = ctx.request.body;
        let rsl = false;
        if (bookInfo.type === "txt")
            rsl = await BookMaker.CreateEmptyBook({
                ...bookInfo
            });

        ApiResponse.GetResult(rsl).toCTX(ctx);
    },

    /**
     * @swagger
     * /library/book/chapter:
     *   post:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 新增/修改指定章节内容
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
    "post /book/chapter": async (ctx) => {
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
     * /library/book/chapterOrder:
     *   patch:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 调整章节顺序
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
    "patch /book/chapterOrder": async (ctx) => {
        let param = await parseJsonFromBodyData(ctx);
        if (!param) return;

        new ApiResponse(await DO.UpdateChapterOrder(param)).toCTX(ctx);
    },

});