const { CreateNewDoc } = require("./../../Core/PDF/PDFToolkit");
const DO = require("../../Core/OTO/DO");


module.exports = () => ({
    /**
     * @swagger
     * /services/pdf/view:
     *   get:
     *     tags:
     *       - Services - PDF —— 系统服务：PDF相关工具
     *     summary: 用PDF预览
     *     description: 创建PDF格式的预览
     *     parameters:
     *       - name: content
     *         in: query
     *         required: true
     *         description: 预览用的文本内容
     *         schema:
     *           type: string
     *       - name: fontsize
     *         in: query
     *         required: false
     *         description: 预览用的字体尺寸
     *         schema:
     *           type: int32
     *       - name: fontfamily
     *         in: query
     *         required: false
     *         description: 预览用的字体名称——不含后缀时默认加`.ttf`
     *         schema:
     *           type: string
     *     consumes:
     *       - application/pdf
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "get /view": async (ctx) => {
        const param = ctx.request?.query;
        ctx.set('Content-Type', "application/pdf");
        let content = param.content;
        if (!param.content && !param.chapterId) {
            content = "请求参数错误";
        }
        if (param.chapterId) {
            let chapter = await DO.GetEBookChapterById(param.chapterId * 1);
            content = chapter.Title + "\n\n" + chapter.Content;
        }
        ctx.status = 200;

        let pdf = await CreateNewDoc({        //只有开头一半 报错：在end之后继续写入
            fontFamily: param.fontfamily,
            fontSize: param.fontsize || 26,
        }, content);

        ctx.body = pdf;
    },
});