const DO = require("./../../Core/OTO/DO.js");

const PDFMaker = require("./../../Core/PDF/PDFMaker.js");
const Server = require("./../../Core/Server");
const ApiResponse = require('../../Entity/ApiResponse');
const { SendAMail } = require("./../../Core/services/email")

module.exports = () => ({
    /**
     * @swagger
     * /library/pdf:
     *   post:
     *     tags:
     *       - Library - PDF —— 图书馆产物：PDF
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
    "post ": async (ctx) => {
        let param = await Server.parseJsonFromBodyData(ctx, ["bookId"]);

        var bookid = param.bookId;
        let ebook = await DO.GetPDFById(bookid);
        ebook.FontFamily = "Alibaba-PuHuiTi-Medium";    //debug

        //没指定章节ID时默认拿到所有章节列表
        let cIds = param.chapterIds;
        if (!cIds || cIds.length == 0) {
            cIds = ebook.Index.map(item => item.IndexId);
        }

        if (cIds.length == 0) {
            new ApiResponse(ebook.BookName, "没有可用章节，请先添加章节内容", 50000).toCTX(ctx);
            return;
        }

        let pdfMaker = new PDFMaker(ebook);
        await pdfMaker.SetShowChapters(cIds);

        await pdfMaker.MakePdfFile().then(async (rsl) => {
            if (param.sendByEmail) {
                await SendAMail({
                    title: rsl.filename,
                    content: rsl.filename,
                    files: [rsl.path]
                });
            }
            new ApiResponse({ book: rsl, chapterIds: cIds }).toCTX(ctx);
        }).catch((err) => {
            console.warn("生成PDF出错：", err.message);
            new ApiResponse(err, `生成PDF${param.sendByEmail ? "并发送邮件" : ""}出错：` + err.message, 50000).toCTX(ctx);
        });
    },
});