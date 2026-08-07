import DO from "../../Core/OTO/DO/index.js";
import ApiResponse from "../../Entity/ApiResponse.js";
import { parseJsonFromBodyData } from "../../Core/Server.js";
import WebBookMaker from "../../Core/WebBook/WebBookMaker.js";



export default {
    /**
     * @swagger
     * /library/webbook/list:
     *   get:
     *     tags:
     *       - Library - WebBook —— 网文图书馆
     *     summary: 拿到网文列表
     *     description: 拿到所有网文
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 请求失败
     */
    "get /list": async (ctx) => {
        let tagid = ctx.query.tagid * 1;
        let nottag = ctx.query.nottag;
        if (nottag?.length > 0 && nottag?.split(",").length > 0) {
            nottag = nottag.split(",").map((item) => {
                return item * 1;
            });
        }
        new ApiResponse(await DO.GetWebBookList(tagid, nottag)).toCTX(ctx);
    },
    /**
     * @swagger
     * /library/webbook:
     *   get:
     *     tags:
     *       - Library - WebBook —— 网文图书馆
     *     summary: 拿到指定ID的书
     *     description: 拿到指定ID的书
     *     parameters:
     *     - name: bookid
     *       in: query
     *       required: true
     *       description: 需获取的书ID
     *       schema:
     *         type: integer
     *         format: int32
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "get ": async (ctx) => {
        let bookId = ctx.query.bookid;

        if (bookId * 1 != bookId) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }
        const bookInfo = await DO.GetWebBookById(bookId * 1);
        if (bookInfo == null) {
            new ApiResponse(null, "未找到此书", 50000).toCTX(ctx);
            return;
        }
        new ApiResponse(bookInfo).toCTX(ctx);
    },

    /**
     * @swagger
     * /library/webbook:
     *   post:
     *     tags:
     *       - Library - WebBook —— 网文图书馆
     *     summary: 创建书并建立目录
     *     description: 通过传入网文目录页，建立对应的书籍，并建立目录
     *     parameters:
     *       - in: body
     *         name: bookInfo
     *         description: 需获取的书的目录地址，以及是否在封面中嵌入书名
     *         schema:
     *           type: object
     *           required:
     *             - url
     *           properties:
     *             url:
     *               type: string
     *               description: 目录页地址
     *             isEmbedBookName:
     *               type: boolean
     *               description: 是否在封面中嵌入书名
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "post ": async (ctx) => {
        let param = await parseJsonFromBodyData(ctx, ["url"]);
        if (!param) return;

        const bookUrl = param.url;
        let wbm = new WebBookMaker(bookUrl);

        await wbm.UpdateIndex(param.isEmbedBookName)
            .then(() => {
                new ApiResponse("已启动分析，稍后将生成书本配置。").toCTX(ctx);
            }).catch((err) => {
                new ApiResponse(err, err.message, 50000).toCTX(ctx);
            });
    },
    /**
     * @swagger
     * /library/webbook/singlechapter:
     *   post:
     *     tags:
     *       - Library - WebBook —— 网文图书馆
     *     summary: 抓取单章
     *     description: 直接抓取单章内容，并存储文件到库存中
     *     parameters:
     *       - in: body
     *         name: chapterInfo
     *         required: true
     *         description: 请求参数对象
     *         schema:
     *           type: object
     *           required:
     *             - url
     *           properties:
     *             url:
     *               type: string
     *               description: 章节地址
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "post /singlechapter": async (ctx) => {
        let param = await parseJsonFromBodyData(ctx, ["url"]);
        if (!param) return;

        const { ScrapingFromUrlOnWatch } = await import("../../Core/WebBook/WebChapterMaker.js");

        await ScrapingFromUrlOnWatch(param.url, -1)
            .then(() => {
                new ApiResponse("已启动内容抓取，请稍候。").toCTX(ctx);
            }).catch((err) => {
                new ApiResponse(err, err.message, 50000).toCTX(ctx);
            });
    },

    /**
     * @swagger
     * /library/webbook:
     *   delete:
     *     tags:
     *       - Library - WebBook —— 网文图书馆
     *     summary: 删除指定ID的书
     *     description: 删除指定ID的书
     *     parameters:
     *     - name: bookid
     *       in: query
     *       required: true
     *       description: 将要删除书ID
     *       schema:
     *         type: integer
     *         format: int32
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "delete ": async (ctx) => {
        let bookId = ctx.query.bookid;
        if (bookId * 1 != bookId) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }

        await WebBookMaker.DeleteOneBook(bookId).then((rsl) => {
            new ApiResponse().toCTX(ctx);
        }).catch((err) => {
            new ApiResponse(err, "删除出错：" + err.message, 50000).toCTX(ctx);
        })
    },
    /**
     * @swagger
     * /library/webbook/autosync:
     *   post:
     *     tags:
     *       - Library - WebBook —— 网文图书馆
     *     summary: 设置网文是否允许自动更新
     *     description: 自动更新将在系统闲时，后台静默更新。若设置为启用，将同时将该书的空章节在更新队列安排到队首
     *     parameters:
     *       - in: body
     *         name: bookInfo
     *         description: 获取需要更新的书ID，和是否启用自动更新的设置
     *         schema:
     *           type: object
     *           required:
     *             - bookid
     *           properties:
     *             bookid:
     *               type: integer
     *               description: 需要修改的书籍ID
     *             autoSyncEnabled:
     *               type: boolean
     *               description: 是否允许自动更新/同步
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "post /autosync": async (ctx) => {
        let param = await parseJsonFromBodyData(ctx, ["bookid"]);
        if (!param) return;
        let { bookid, autoSyncEnabled } = param;

        await WebBookMaker.SetAutoSync(bookid, autoSyncEnabled).then((rsl) => {
            new ApiResponse().toCTX(ctx);
        }).catch((err) => {
            new ApiResponse(err, "更新【自动更新】设置出错：" + err.message, 50000).toCTX(ctx);
        });
    },
    /**
     * @swagger
     * /library/webbook/updatechapter:
     *   patch:
     *     tags:
     *       - Library - WebBook —— 网文图书馆
     *     summary: 更新指定章节
     *     description: 根据提供的章节ID数组，重新爬取这些ID；如果没有指定章节，则将所有已有正文的章节都算上
     *     parameters:
     *       - in: body
     *         name: bookInfo
     *         description: 需要更新的书目ID，章节信息
     *         schema:
     *           type: object
     *           required:
     *             - bookId
     *           properties:
     *             bookId:
     *               type: integer
     *               format: int32
     *             chapterIds:
     *               type: array
     *               items:
     *                 type: integer
     *                 format: int32
     *             isUpdate:
     *               type: boolean
     *               example: false
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "patch /updatechapter": async (ctx) => {
        let param = await parseJsonFromBodyData(ctx, ["bookId"]);

        let b = await DO.GetWebBookById(param.bookId);

        let cIds = param.chapterIds;
        if (!cIds || cIds.length == 0) {
            cIds = [];
            for (let i of b.Index) {
                if (i.IsHasContent) continue;
                cIds.push(i.IndexId);
            }
        }

        if (cIds.length == 0) {
            new ApiResponse(ebook.BookName, "所有章节已有内容，若需要更新请提供指定章节ID，并开启强制更新。", 50000).toCTX(ctx);
            return;
        }

        let wbm = new WebBookMaker(b);
        await wbm.UpdateChapter(cIds, param.isUpdate).then((rsl) => {
            new ApiResponse(rsl).toCTX(ctx);
        }).catch((err) => {
            new ApiResponse(err, err.message, 50000).toCTX(ctx);
        });

    },

    /**
     * @swagger
     * /library/webbook/addnewsource:
     *   post:
     *     tags:
     *       - Library - WebBook —— 网文图书馆
     *     summary: 新增书来源
     *     description: 提供一个新的目录页地址，作为当前本书当前的新来源（一般是原源挂了）
     *     parameters:
     *       - in: body
     *         name: bookInfo
     *         description: 需要新增来源的书目ID，目录页地址
     *         schema:
     *            type: object
     *            required:
     *              - bookId
     *              - url
     *            properties:
     *              bookId:
     *                type: integer
     *                format: int32
     *              url:
     *                type: string
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 接口执行出错
     */
    "post /addnewsource": async (ctx) => {
        let param = await parseJsonFromBodyData(ctx, ["bookId", "url"]);
        let b = await DO.GetWebBookById(param.bookId);
        await b.AddIndexUrl(param.url, true)
            .then(result => {
                new ApiResponse(result).toCTX(ctx);
            }).catch((err) => {
                new ApiResponse(err, "新增出错：" + err.message, 50000).toCTX(ctx);
            });
    },
    /**
     * @swagger
     * /library/webbook/mergeindex:
     *   patch:
     *     tags:
     *       - Library - WebBook —— 网文图书馆
     *     summary: 合并更新整个目录
     *     description: 将当前默认来源网站内容，与现有目录合并，并按章节同名规则加入章节页面地址。可以为同一本书合入不同来源网站。
     *     parameters:
     *       - in: body
     *         name: bookInfo
     *         description: 需要更新的书目ID，章节信息
     *         schema:
     *           type: object
     *           required:
     *             - bookId
     *           properties:
     *             bookId:
     *               type: integer
     *               format: int32
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "patch /mergeindex": async (ctx) => {
        let param = await parseJsonFromBodyData(ctx, ["bookId"]);

        let wbm = new WebBookMaker(param.bookId);
        await wbm.loadFromDB;   //这是个 Promise 对象，要等数据都加载好
        let curBook = wbm.GetBook();

        let lastIndex = await curBook.GetMaxIndexOrder();

        await wbm.UpdateIndex(null, "", lastIndex + 1).then((rsl) => {
            new ApiResponse().toCTX(ctx);
        }).catch((err) => {
            new ApiResponse(err, "更新目录出错：" + err.message, 50000).toCTX(ctx);
        })
    },
    /**
     * @swagger
     * /library/webbook/sources:
     *   get:
     *     tags:
     *       - Library - WebBook —— 网文图书馆
     *     summary: 拿到指定ID书的目录来源地址
     *     description: 拿到指定ID书的，网页来源的地址
     *     parameters:
     *     - name: bookid
     *       in: query
     *       required: true
     *       description: 需获取的书ID
     *       schema:
     *         type: integer
     *         format: int32
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "get /sources": async (ctx) => {
        let bookId = ctx.query.bookid;
        if (bookId * 1 != bookId) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }

        new ApiResponse(await DO.GetWebBookSourcesById(bookId * 1)).toCTX(ctx);
    },
    /**
     * @swagger
     * /library/webbook/defsources:
     *   get:
     *     tags:
     *       - Library - WebBook —— 网文图书馆
     *     summary: 拿到指定ID书目录的默认来源地址
     *     description: 拿到指定ID书的，网页来源的默认地址
     *     parameters:
     *     - name: bookid
     *       in: query
     *       required: true
     *       description: 需获取的书ID
     *       schema:
     *         type: integer
     *         format: int32
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "get /defsources": async (ctx) => {
        let bookId = ctx.query.bookid;
        if (bookId * 1 != bookId) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }

        new ApiResponse(await DO.GetWebBookDefaultSourcesById(bookId * 1)).toCTX(ctx);
    },


    /**
     * @swagger
     * /library/webbook/chapter/sources:
     *   get:
     *     tags:
     *       - Library - WebBook —— 网文图书馆
     *     summary: 拿到指定章节的来源地址
     *     description: 拿到指定章节的网页来源的地址
     *     parameters:
     *     - name: chapterid
     *       in: query
     *       required: true
     *       description: 章节ID
     *       schema:
     *         type: integer
     *         format: int32
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     */
    "get /chapter/sources": async (ctx) => {
        let chapterid = ctx.query.chapterid;
        if (chapterid * 1 != chapterid) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }

        new ApiResponse(await DO.GetWebBookChapterSourcesById(chapterid * 1)).toCTX(ctx);
    },

    /**
     * @swagger
     * /library/webbook/chapter/sources:
     *   post:
     *     tags:
     *       - Library - WebBook —— 网文图书馆
     *     summary: 修改章节的网页来源的地址
     *     description: 修改章节的网页来源的地址
     *     parameters:
     *     - name: chapterid
     *       in: query
     *       required: true
     *       description: 章节ID
     *       schema:
     *         type: integer
     *         format: int32
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     */
    "post /chapter/sources": async (ctx) => {
        let param = await parseJsonFromBodyData(ctx, ["id", "url"]);

        if (!param) return;
        new ApiResponse(await DO.SetWebBookChapterSources(param.id, param.url)).toCTX(ctx);
    },

};