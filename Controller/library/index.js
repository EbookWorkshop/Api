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
     *     - name: nottag
     *       in: query
     *       required: false
     *       description: 排除的标签ID，多个用逗号分隔
     *       schema:
     *         type: integer
     *         format: string
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
        let nottag = ctx.query.nottag;
        if (nottag?.length > 0 && nottag?.split(",").length > 0) {
            nottag = nottag.split(",").map((item) => {
                return item * 1;
            });
        }
        new ApiResponse(await DO.GetBookList(tagid, nottag)).toCTX(ctx);
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
        const bookId = ctx.query.bookid;
        if (bookId * 1 != bookId) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }
        const ebook = await DO.GetEBookById(bookId * 1);
        await ebook.LoadIntroduction();
        new ApiResponse(ebook).toCTX(ctx);
    },

    /**
     * @swagger
     * /library/book:
     *   delete:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 删除指定的书
     *     description: 删除书
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
     */
    "delete /book": async (ctx) => {
        const bookId = ctx.query.bookid;
        if (bookId * 1 != bookId) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }

        await DO.DeleteOneBook(bookId).then((rsl) => {
            new ApiResponse(rsl).toCTX(ctx);
        }).catch((err) => {
            new ApiResponse(err, "删除出错：" + err.message, 50000).toCTX(ctx);
        })
    },

    /**
     * @swagger
     * /library/book/metadata:
     *   get:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 拿到指定ID的书的信息
     *     description: 拿到指定ID的书的信息
     *     parameters:
     *     - name: bookid
     *       in: query
     *       required: true
     *       description: 需获取信息的书ID
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
    "get /book/metadata": async (ctx) => {
        const bookId = ctx.query.bookid;
        if (bookId * 1 != bookId) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }

        new ApiResponse(await DO.GetEBookInfoById(bookId * 1)).toCTX(ctx);
    },

    /**
     * @swagger
     * /library/book/metadata:
     *   patch:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 修改元数据
     *     description: 修改书的元数据
     *     parameters:
     *     - name: book
     *       in: body
     *       required: true
     *       description: 书的元数据
     *       schema:
     *         type: object
     *     consumes:
     *       - multipart/form-data
     *     responses:
     *       200:
     *         description: 请求成功
     */
    "patch /book/metadata": async (ctx) => {
        let bookInfo = await parseJsonFromBodyData(ctx, ["id"]);
        if (!bookInfo) return;

        let metadata = {}
        if (bookInfo.name) metadata.BookName = bookInfo.name;
        if (bookInfo.author) metadata.Author = bookInfo.author;
        if (bookInfo.font) metadata.FontFamily = bookInfo.font;
        if (bookInfo.bookCover) metadata.CoverImg = bookInfo.bookCover;
        if (bookInfo.coverFile) { metadata.converFile = bookInfo.coverFile[0]; }
        if (bookInfo.introduction) metadata.Introduction = bookInfo.introduction;

        let rsl = BookMaker.EditEBookInfo(bookInfo.id, metadata);

        ApiResponse.GetResult(rsl).toCTX(ctx);
    },

    /**
     * @swagger
     * /library/book/search:
     *   post:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 检索图书馆
     *     description: 检索图书馆
     *     parameters:
     *     - name: data
     *       in: body
     *       required: true
     *       description: 查询条件
     *       schema:
     *         type: object
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     */
    "post /book/search": async (ctx) => {
        let bookInfo = await parseJsonFromBodyData(ctx, ["keyword"]);

        let rsl = await DO.Search(bookInfo.keyword, bookInfo.option);

        ApiResponse.GetResult(rsl).toCTX(ctx);
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
     * /library/book/duplicates:
     *   get:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 查找重复章节内容
     *     description: 根据相似度阈值查找重复章节
     *     parameters:
     *     - name: bookid
     *       in: query
     *       required: true
     *       description: 书籍ID
     *       schema:
     *         type: integer
     *     - name: threshold
     *       in: query
     *       required: false
     *       description: 相似度阈值(0-1，默认0.5)
     *       schema:
     *         type: number
     *     responses:
     *       200:
     *         description: 查重结果
     */
    "get /book/duplicates": async (ctx) => {
        const bookId = ctx.query.bookid * 1;
        const threshold = parseFloat(ctx.query.threshold) || 0.36;

        if (isNaN(bookId)) {
            new ApiResponse(null, "无效的书籍ID", 60000).toCTX(ctx);
            return;
        }

        try {
            const duplicates = await BookMaker.FindDuplicateContents(bookId, threshold);
            new ApiResponse(duplicates).toCTX(ctx);
        } catch (error) {
            new ApiResponse(null, error.message, 50000).toCTX(ctx);
        }
    },

    /**
     * @swagger
     * /library/book/heat:
     *   post:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 热度-更新热度
     *     description: 为当前书籍热度加1
     *     parameters:
     *     - name: bookId
     *       in: body
     *       required: true
     *       schema:
     *         type: object
     *         properties:
     *           bookId:
     *             type: integer
     *             format: int64
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 
     */
    "post /book/heat": async (ctx) => {
        const param = await parseJsonFromBodyData(ctx, ["bookId"]);
        if (!param) return;
        const bookId = param.bookId;

        try {
            const results = await BookMaker.Heat(bookId);
            new ApiResponse(results).toCTX(ctx);
        } catch (error) {
            new ApiResponse(null, `更新热度失败: ${error.message}`, 50000).toCTX(ctx);
        }
    },

    /**
     * @swagger
     * /library/book/pairedpunctuation:
     *   get:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 查找不匹配的标点符号
     *     description: 检查成对的标点符号，统计数量不匹配的情况
     *     parameters:
     *     - name: bookid
     *       in: query
     *       required: true
     *       description: 书籍ID
     *       schema:
     *         type: integer
     *     - name: chapterids
     *       in: query
     *       required: false
     *       description: 在限定章节内查找，缺省为全部章节
     *       schema:
     *         type: number[]
     *     responses:
     *       200:
     *         description: 执行结果
     */
    "get /book/pairedpunctuation": async (ctx) => {
        try {
            const bookId = ctx.query.bookid * 1;
            const chapterids = ctx.query.chapterids;
            const { checkPairedPunctuation } = require("./../../Core/Book/CheckPairedPunctuation");

            let cpIds = null;
            try {
                cpIds = JSON.parse(chapterids);
            } catch (e) {
                cpIds = null;
            }

            const results = await checkPairedPunctuation(bookId, cpIds);
            new ApiResponse(results).toCTX(ctx);
        } catch (error) {
            new ApiResponse(null, `查找不匹配的标点符号失败: ${error.message}`, 50000).toCTX(ctx);
        }
    },

    /**
     * @swagger
     * /library/book/analytics/text:    
     *   get:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 书籍统计分析
     *     description: 对书籍文本进行统计分析
     *     parameters:
     *     - name: bookid
     *       in: query
     *       required: true
     *       description: 书籍ID
     *       schema:
     *         type: integer
     *     responses:
     *       200:
     *         description: 文本分析结果
     */
    "get /book/analytics/text": async (ctx) => {
        try {
            const bookId = ctx.query.bookid;
            if (bookId * 1 != bookId) {
                new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
                return;
            }
            const { AnalyzeBookText } = require("./../../Core/Book/Analyze");

            const results = await AnalyzeBookText(bookId * 1);
            new ApiResponse(results).toCTX(ctx);
        } catch (error) {
            new ApiResponse(null, `文本分析失败: ${error.message}`, 50000).toCTX(ctx);
        }
    },
});