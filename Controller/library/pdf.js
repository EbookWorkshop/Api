//const DB = require("./../../Core/OTO/DatabaseHelper");
const DO = require("./../../Core/OTO/DO.js");

const PDFMaker = require("./../../Core/PDF/PDFMaker.js");
const Server = require("./../../Core/Server");


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

        let cIds = param.chapterIds;
        if (!cIds || cIds.length == 0) {
            cIds = [];
            for (let i of ebook.Index) {
                if (!i.IsHasContent) continue;

                cIds.push(i.IndexId);
            }
        }

        if (cIds.length == 0) {
            ctx.body = JSON.stringify({ ret: 1, err: "没有可用章节，请先添加章节内容", bookname: ebook.BookName });
            return;
        }

        let pdfMaker = new PDFMaker(ebook);
        await pdfMaker.SetShowChapters(cIds);

        await pdfMaker.MakePdfFile().then((rsl) => {
            ctx.body = JSON.stringify({ ret: 0, book: rsl, chapterIds: cIds });
        }).catch((err) => {
            console.warn("生成PDF出错：", err.message);
            ctx.body = JSON.stringify({ ret: 1, err: "生成PDF出错：" + err.message });
        });
    },
});