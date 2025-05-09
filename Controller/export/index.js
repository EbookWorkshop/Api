
const BookMaker = require("../../Core/Book/BookMaker");
const PDFMaker = require("../../Core/PDF/PDFMaker");
const EPUBMaker = require("../../Core/EPUB/EPUBMaker");
const { parseJsonFromBodyData } = require("../../Core/Server");
const ApiResponse = require("../../Entity/ApiResponse");
const { SendAMail } = require("../../Core/services/email");
const { dataPath } = require("../../config");
const path = require("path");

module.exports = () => ({
    /**
     * @swagger
     * /export/pdf:
     *   post:
     *     tags:
     *       - Export —— 图书馆产物
     *     summary: 创建一本PDF
     *     description: 根据提供的章节ID数组，打包成一本PDF
     *     parameters:
     *       - in: body
     *         name: bookInfo
     *         description: 需要包含的书目ID，章节信息;如果没有指定章节，则将所有已有正文的章节都算上
     *         schema:
     *           type: object
     *           required:
     *             - bookId
     *           properties:
     *             bookId:
     *               type: integer
     *               format: int32
     *             sendByEmail:
     *               type: boolean
     *             embedTitle:
     *               type: boolean
     *             fontFamily:
     *               type: string
     *             chapterIds:
     *               type: array
     *               items:
     *                 type: integer
     *                 format: int32
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "post /pdf": async (ctx) => {
        let param = await parseJsonFromBodyData(ctx, ["bookId"]);
        if (!param) return;

        await PDFMaker.MakePdfFile(param.bookId, param.chapterIds, param.fontFamily, param.embedTitle).then(async (rsl) => {
            if (param.sendByEmail) {
                await SendAMail({
                    title: rsl.filename,
                    content: rsl.filename,
                    files: [rsl.path]
                });
            }
            const relativePath = path.relative(dataPath, rsl.path);
            new ApiResponse({ book: rsl, chapterIds: param.chapterIds, download: relativePath }).toCTX(ctx);
        }).catch((err) => {
            new ApiResponse(err, `生成PDF${param.sendByEmail ? "并发送邮件" : ""}出错：` + (err.message || err), 50000).toCTX(ctx);
        });
    },

    /**
     * @swagger
     * /export/txt:
     *   post:
     *     tags:
     *       - Export —— 图书馆产物
     *     summary: 创建一本Txt
     *     description: 根据提供的章节ID数组，打包成一本Txt
     *     parameters:
     *       - in: body
     *         name: bookInfo
     *         description: 需要包含的书目ID，章节信息;如果没有指定章节，则将所有已有正文的章节都算上
     *         schema:
     *           type: object
     *           required:
     *             - bookId
     *           properties:
     *             bookId:
     *               type: integer
     *               format: int32
     *             sendByEmail:
     *               type: boolean
     *             embedTitle:
     *               type: boolean
     *             fontFamily:
     *               type: string
     *             chapterIds:
     *               type: array
     *               items:
     *                 type: integer
     *                 format: int32
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "post /txt": async (ctx) => {
        let param = await parseJsonFromBodyData(ctx, ["bookId"]);

        let bookid = param.bookId;
        let cIds = param.chapterIds;

        await BookMaker.MakeTxtFile(bookid, cIds, param.embedTitle).then(async (rsl) => {
            if (param.sendByEmail) {
                await SendAMail({
                    title: rsl.filename,
                    content: rsl.filename,
                    files: [rsl.path]
                });
            }
            const relativePath = path.relative(dataPath, rsl.path);
            new ApiResponse({ book: rsl, chapterIds: cIds, download: relativePath }).toCTX(ctx);
        }).catch((err) => {
            new ApiResponse(err, `生成Txt${param.sendByEmail ? "并发送邮件" : ""}出错：` + (err.message || err), 50000).toCTX(ctx);
        });

    },

    /**
     * @swagger
     * /export/epub:
     *   post:
     *     tags:
     *       - Export —— 图书馆产物
     *     summary: 创建一本EPUB
     *     description: 根据提供的章节ID数组，打包成一本EPUB
     *     parameters:
     *       - in: body
     *         name: bookInfo
     *         description: 需要包含的书目ID，章节信息;如果没有指定章节，则将所有已有正文的章节都算上
     *         schema:
     *           type: object
     *           required:
     *             - bookId
     *           properties:
     *             bookId:
     *               type: integer
     *               format: int32
     *             sendByEmail:
     *               type: boolean
     *             embedTitle:
     *               type: boolean
     *             fontFamily:
     *               type: string
     *             chapterIds:
     *               type: array
     *               items:
     *                 type: integer
     *                 format: int32
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "post /epub": async (ctx) => {
        let param = await parseJsonFromBodyData(ctx, ["bookId"]);
        if (!param) return;

        await EPUBMaker.MakeEPUBFile(param.bookId, param.chapterIds, param.fontFamily, param.embedTitle).then(async (rsl) => {
            if (param.sendByEmail) {
                await SendAMail({
                    title: rsl.filename,
                    content: rsl.filename,
                    files: [rsl.path]
                });
            }
            const relativePath = path.relative(dataPath, rsl.path);
            new ApiResponse({ book: rsl, chapterIds: param.chapterIds, download: relativePath }).toCTX(ctx);
        }).catch((err) => {
            new ApiResponse(err, `生成EPUB${param.sendByEmail ? "并发送邮件" : ""}出错：` + (err.message || err), 50000).toCTX(ctx);
        });
    },
});