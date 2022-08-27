const DO = require("../../Core/OTO/DO");
const WebBookMaker = require("./../../Core/WebBook/WebBookMaker");


/**
 * 处理通过body传递的参数
 * @param {*} ctx 
 * @returns 
 */
function paresBodyData(ctx) {
    return new Promise((resolve, reject) => {
        try {
            let postData = ''
            ctx.req.addListener('data', (data) => {
                postData += data
            })
            ctx.req.on('end', () => {
                resolve(postData)
            })

        } catch (err) {
            reject(err)
        }
    })
}

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
        if (bookId * 1 != bookId) {
            ctx.status = 600;
            return;
        }

        ctx.body = await DO.GetWebBookById(bookId * 1);
    },

    /**
     * @swagger
     * /library/webbook:
     *   post:
     *     tags:
     *       - Library - WebBook —— 网文图书馆
     *     summary: 创建书
     *     description: 通过传入网文目录页，建立对应的书籍
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
        let bookUrl = await paresBodyData(ctx);

        let wbm = new WebBookMaker(bookUrl);
        await wbm.UpdateIndex()
            .then(result => {
                let book = wbm.GetBook();
                ctx.body = JSON.stringify(book);
            });
    },

    /**
     * @swagger
     * /library/webbook/updatechapter:
     *   patch:
     *     tags:
     *       - Library - WebBook —— 网文图书馆
     *     summary: 更新指定章节
     *     description: 根据提供的章节ID数组，重新爬取这些ID
     *     parameters:
     *       - in: body
     *         name: user
     *         description: 需要更新的书目ID，章节信息
     *         schema:
     *           type: object
     *           required:
     *             - bookId
     *             - chapterIds
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
        let bodyStr = await paresBodyData(ctx);
        let param = null;
        try {
            param = JSON.parse(bodyStr);
            if (!param.bookId || !param.chapterIds) throw ("参数错误。缺少必要参数。");
        } catch (err) {
            ctx.status = 600;
            return;
        }

        let b = await DO.GetWebBookById(param.bookId);
        let wbm = new WebBookMaker(b);
        await wbm.UpdateChapter(param.chapterIds, param.isUpdate);
        ctx.body = JSON.stringify({ ret: 0, data: param });
    }
});