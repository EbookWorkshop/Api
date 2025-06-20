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
        if (nottag?.split(",").length > 0) {
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
        let bookId = ctx.query.bookid;
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
        let bookId = ctx.query.bookid;
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
        let bookId = ctx.query.bookid;
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

    /**
     * @swagger
     * /library/book/chapter/listhidden:
     *   get:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 找到指定书下面已隐藏的章节
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
    "get /book/chapter/listhidden": async (ctx) => {
        let bookid = ctx.query.bookid;
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
     *     summary: 切换章节是否隐藏
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
    "patch /book/chapter/toggleHide": async (ctx) => {
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
     *     summary: 删除指定章节
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
    "delete /book/chapter": async (ctx) => {
        let chapterId = ctx.query.chapterid;
        if (chapterId * 1 != chapterId) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }

        new ApiResponse(await BookMaker.DeleteAChapter(chapterId)).toCTX(ctx);
    },

    /**
     * @swagger
     * /library/book/chapters/restructure:
     *   patch:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 章节重组操作
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
    "patch /book/chapters/restructure": async (ctx) => {
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
     *     summary: 转换章节为书籍简介
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
    "post /book/chapter/tointroduction": async (ctx) => {
        const param = await parseJsonFromBodyData(ctx, ["chapterId"]);
        const chapterId = param.chapterId * 1;

        try {
            const results = await BookMaker.Chapter2Introduction(chapterId);
            new ApiResponse(results).toCTX(ctx);
        } catch (error) {
            new ApiResponse(null, `转化章节为书籍简介失败: ${error.message}`, 50000).toCTX(ctx);
        }
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
            const {checkPairedPunctuation} = require("./../../Core/Book/CheckPairedPunctuation");
            

            const results = await checkPairedPunctuation(bookId, chapterids);
            new ApiResponse(results).toCTX(ctx);
        } catch (error) {
            new ApiResponse(null, `查找不匹配的标点符号失败: ${error.message}`, 50000).toCTX(ctx);
        }
    }
});