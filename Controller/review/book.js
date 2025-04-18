//全书校阅

const { parseJsonFromBodyData } = require("./../../Core/Server");
const ApiResponse = require("../../Entity/ApiResponse");

const ReviewBook = require("../../Core/Review/Book");


module.exports = () => ({
    /**
    * @swagger
    * /review/book/try:
    *   post:
    *     tags:
    *       - Review - Book —— 自助校阅 - 全书校阅
    *     summary: 尝试校阅结果
    *     description: 将当前规则，按抽取的章节进行校阅，返回测试结果
    *     parameters:
    *       - in: body
    *         name: setting
    *         description: 测试规则设置
    *         schema:
    *             type: object
    *             required:
    *               - chapterids
    *               - regex
    *             properties:
    *               chapterids:
    *                 type: array
    *               regex:
    *                 type: string
    *     consumes:
    *       - application/json
    *     responses:
    *       200:
    *         description: 请求成功
    */
    "post /try": async (ctx) => {
        let param = await parseJsonFromBodyData(ctx, ["chapterids", "regex"]);
        if (param == null) return;

        const result = await ReviewBook.Try(param);
        new ApiResponse(result).toCTX(ctx);
    },
    /**
    * @swagger
    * /review/book/save:
    *   post:
    *     tags:
    *       - Review - Book —— 自助校阅 - 全书校阅
    *     summary: 按当前规则校阅并保存到数据库
    *     description: 将当前规则，按抽取的章节进行校阅，并保存到数据库
    *     parameters:
    *       - in: body
    *         name: setting
    *         description: 校阅设置
    *         schema:
    *             type: object
    *             required:
    *               - bookid
    *               - regex
    *             properties:
    *               bookid:
    *                 type: number
    *               regex:
    *                 type: string
    *     consumes:
    *       - application/json
    *     responses:
    *       200:
    *         description: 请求成功
    */
    "post /save": async (ctx) => {
        let param = await parseJsonFromBodyData(ctx, ["bookid", "regex"]);
        if (param == null) return;

        const result = await ReviewBook.Save(param);
        new ApiResponse(result).toCTX(ctx);
    },
});