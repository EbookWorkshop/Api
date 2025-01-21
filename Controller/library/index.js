const DO = require("../../Core/OTO/DO");
const BookMaker = require('../../Core/Book/BookMaker');
const ApiResponse = require("./../../Entity/ApiResponse");

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
     *     summary: 修改指定章节内容
     *     description: 根据提供的信息修改章节内容
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
        // let chapter = ctx.request.body;
        // let chapterId = chapter.IndexId;
        // if (chapterId * 1 !== chapterId || (!chapter.Content && !chapter.Title)) {
        //     new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
        //     return;
        // }

        let chapter = await Server.parseJsonFromBodyData(ctx);
        let chapterId = chapter.IndexId;
        if (chapterId * 1 !== chapterId || (!chapter.Content && !chapter.Title)) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }

        new ApiResponse(await DO.UpdateChapter(chapter)).toCTX(ctx);
    },
});