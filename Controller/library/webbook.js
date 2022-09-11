const DO = require("../../Core/OTO/DO");
const WebBookMaker = require("./../../Core/WebBook/WebBookMaker");
const Server = require("./../../Core/Server");
const ApiResponse = require("./../../Entity/ApiResponse");



module.exports = () => ({
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
        let result = new ApiResponse();
        if (bookId * 1 != bookId) {
            ctx.status = 600;
            result.code = 60000;
            result.msg = "参数错误";
            ctx.body = result.getJSONString();
            return;
        }

        result.data = await DO.GetWebBookById(bookId * 1);
        ctx.body = result.getJSONString();
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
     *     - name: bookIndexUrl
     *       in: body
     *       required: true
     *       description: 需获取的书的目录地址
     *       schema:
     *         type: string
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "post ": async (ctx) => {
        let backRsl = new ApiResponse();

        let bookUrl = await Server.parseBodyData(ctx);

        let wbm = new WebBookMaker(bookUrl);
        await wbm.UpdateIndex()
            .then(result => {
                backRsl.data = wbm.GetBook();
                ctx.body = backRsl.getJSONString();
            }).catch((err) => {
                backRsl.code = 50000;
                backRsl.msg = err.message;
                ctx.body = backRsl.getJSONString();
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
            ctx.status = 600;
            return;
        }

        await WebBookMaker.DeleteOneBook(bookId).then((rsl) => {
            ctx.body = new ApiResponse().getJSONString();
        }).catch((err) => {
            ctx.body = new ApiResponse({ code: 50000, msg: "删除出错：" + err.message }).getJSONString();
        })
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
        let result = new ApiResponse();

        let param = await Server.parseJsonFromBodyData(ctx, ["bookId"]);

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
            result.msg = "所有章节已有内容，若需要更新请提供指定章节ID，并开启强制更新。";
            result.data = ebook.BookName;
            result.code = 50000
            ctx.body = result.getJSONString();
            return;
        }

        let wbm = new WebBookMaker(b);
        await wbm.UpdateChapter(cIds, param.isUpdate).then((rsl) => {
            result.data = rsl;
        }).catch((err) => {
            result.code = 50000;
            result.msg = err.message;
        }).finally(() => {
            ctx.body = result.getJSONString();
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
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "post /addnewsource": async (ctx) => {
        let param = await Server.parseJsonFromBodyData(ctx, ["bookId", "url"]);
        let b = await DO.GetWebBookById(param.bookId);
        await b.AddIndexUrl(param.url, true)
            .then(result => {
                ctx.body = new ApiResponse().getJSONString();
            }).catch((err) => {
                ctx.body = new ApiResponse({ code: 50000, msg: "新增出错：" + err.message }).getJSONString();
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
        let param = await Server.parseJsonFromBodyData(ctx, ["bookId"]);

        let wbm = new WebBookMaker(param.bookId);
        await wbm.loadFromDB;
        let curBook = wbm.GetBook();

        let lastIndex = await curBook.GetMaxIndexOrder();

        await wbm.UpdateIndex("", lastIndex + 1).then((rsl) => {
            ctx.body = new ApiResponse().getJSONString();
        }).catch((err) => {
            ctx.body = new ApiResponse({ code: 50000, msg: "更新目录出错：" + err.message }).getJSONString();
        })

    }
});