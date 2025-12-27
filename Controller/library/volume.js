const BookMaker = require('../../Core/Book/BookMaker');
const ApiResponse = require("./../../Entity/ApiResponse");
const { parseJsonFromBodyData } = require("./../../Core/Server");

module.exports = () => ({
    prefix: '/library/book',
    /**
     * @swagger
     * /library/book/volume: 
     *   post:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 【卷】创建新卷
     *     description: 为指定书籍创建一个新卷
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
     *           title:
     *             type: string
     *           introduction:
     *             type: string
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 创建成功
     *       600:
     *         description: 参数错误
     *       500:
     *         description: 服务器错误
     */
    "post ": async (ctx) => {
        const param = await parseJsonFromBodyData(ctx, ["bookId", "title"]);
        if (!param) return;

        try {
            const volume = await BookMaker.CreateVolume(
                param.bookId,
                param.title,
                param.introduction
            );
            new ApiResponse(volume).toCTX(ctx);
        } catch (error) {
            new ApiResponse(null, `创建卷失败: ${error.message}`, 50000).toCTX(ctx);
        }
    },

    /**
     * @swagger
     * /library/book/volume: 
     *   put:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 【卷】更新卷信息
     *     description: 更新指定卷的标题或简介
     *     parameters:
     *     - name: body
     *       in: body
     *       required: true
     *       schema:
     *         type: object
     *         properties:
     *           volumeId:
     *             type: integer
     *             format: int64
     *           title:
     *             type: string
     *           introduction:
     *             type: string
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 更新成功
     *       600:
     *         description: 参数错误
     *       500:
     *         description: 服务器错误
     */
    "put ": async (ctx) => {
        const param = await parseJsonFromBodyData(ctx, ["volumeId"]);
        if (!param) return;

        try {
            const success = await BookMaker.UpdateVolume(param.volumeId, {
                title: param.title,
                introduction: param.introduction
            });
            new ApiResponse(success).toCTX(ctx);
        } catch (error) {
            new ApiResponse(null, `更新卷失败: ${error.message}`, 50000).toCTX(ctx);
        }
    },

    /**
     * @swagger
     * /library/book/volume: 
     *   delete:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 【卷】删除卷
     *     description: 删除指定卷，卷中的章节将移到书籍根级
     *     parameters:
     *     - name: volumeId
     *       in: query
     *       required: true
     *       description: 卷ID
     *       schema:
     *         type: integer
     *         format: int64
     *     responses:
     *       200:
     *         description: 删除成功
     *       600:
     *         description: 参数错误
     *       500:
     *         description: 服务器错误
     */
    "delete ": async (ctx) => {
        const volumeId = ctx.query.volumeId * 1;
        if (isNaN(volumeId)) {
            new ApiResponse(null, "无效的卷ID", 60000).toCTX(ctx);
            return;
        }

        try {
            const success = await BookMaker.DeleteVolume(volumeId);
            new ApiResponse(success).toCTX(ctx);
        } catch (error) {
            new ApiResponse(null, `删除卷失败: ${error.message}`, 50000).toCTX(ctx);
        }
    },

    /**
     * @swagger
     * /library/book/volume/all: 
     *   get:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 【卷】获取书籍的所有卷
     *     description: 获取指定书籍的所有卷信息
     *     parameters:
     *     - name: bookId
     *       in: query
     *       required: true
     *       description: 书籍ID
     *       schema:
     *         type: integer
     *         format: int64
     *     responses:
     *       200:
     *         description: 获取成功
     *       600:
     *         description: 参数错误
     *       500:
     *         description: 服务器错误
     */
    "get /all": async (ctx) => {
        const bookId = ctx.query.bookId * 1;
        if (isNaN(bookId)) {
            new ApiResponse(null, "无效的书籍ID", 60000).toCTX(ctx);
            return;
        }

        try {
            const volumes = await BookMaker.GetVolumes(bookId);
            new ApiResponse(volumes).toCTX(ctx);
        } catch (error) {
            new ApiResponse(null, `获取卷列表失败: ${error.message}`, 50000).toCTX(ctx);
        }
    },

    /**
     * @swagger
     * /library/book/volume/chapters: 
     *   get:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 【卷】获取卷下的所有章节
     *     description: 获取指定卷下的所有章节
     *     parameters:
     *     - name: volumeId
     *       in: query
     *       required: true
     *       description: 卷ID
     *       schema:
     *         type: integer
     *         format: int64
     *     responses:
     *       200:
     *         description: 获取成功
     *       600:
     *         description: 参数错误
     *       500:
     *         description: 服务器错误
     */
    "get /chapters": async (ctx) => {
        const volumeId = ctx.query.volumeId * 1;
        if (isNaN(volumeId)) {
            new ApiResponse(null, "无效的卷ID", 60000).toCTX(ctx);
            return;
        }

        try {
            const chapters = await BookMaker.GetVolumeChapters(volumeId);
            new ApiResponse(chapters).toCTX(ctx);
        } catch (error) {
            new ApiResponse(null, `获取卷下章节失败: ${error.message}`, 50000).toCTX(ctx);
        }
    },

    /**
     * @swagger
     * /library/book/volume/movechapters: 
     *   post:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 【卷】将章节移动到指定卷
     *     description: 将指定的章节移动到指定的卷中
     *     parameters:
     *     - name: body
     *       in: body
     *       required: true
     *       schema:
     *         type: object
     *         properties:
     *           volumeId:
     *             type: integer
     *             format: int64
     *           chapterIds:
     *             type: array
     *             items:
     *               type: integer
     *               format: int64
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 移动成功
     *       600:
     *         description: 参数错误
     *       500:
     *         description: 服务器错误
     */
    "post /movechapters": async (ctx) => {
        const param = await parseJsonFromBodyData(ctx, ["volumeId", "chapterIds"]);
        if (!param) return;

        try {
            const success = await BookMaker.MoveChaptersToVolume(
                param.volumeId,
                param.chapterIds
            );
            new ApiResponse(success).toCTX(ctx);
        } catch (error) {
            new ApiResponse(null, `移动章节失败: ${error.message}`, 50000).toCTX(ctx);
        }
    },

    /**
     * @swagger
     * /library/book/volume/removechapters: 
     *   post:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 【卷】从卷中移除章节
     *     description: 将指定章节从卷中移除，移到书籍根级
     *     parameters:
     *     - name: body
     *       in: body
     *       required: true
     *       schema:
     *         type: object
     *         properties:
     *           chapterIds:
     *             type: array
     *             items:
     *               type: integer
     *               format: int64
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 移除成功
     *       600:
     *         description: 参数错误
     *       500:
     *         description: 服务器错误
     */
    "post /removechapters": async (ctx) => {
        const param = await parseJsonFromBodyData(ctx, ["chapterIds"]);
        if (!param) return;

        try {
            const success = await BookMaker.RemoveChaptersFromVolume(param.chapterIds);
            new ApiResponse(success).toCTX(ctx);
        } catch (error) {
            new ApiResponse(null, `移除章节失败: ${error.message}`, 50000).toCTX(ctx);
        }
    },

    /**
     * @swagger
     * /library/book/volume/reorder: 
     *   post:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 【卷】更新卷排序
     *     description: 批量更新卷的排序顺序
     *     parameters:
     *     - name: body
     *       in: body
     *       required: true
     *       schema:
     *         type: object
     *         properties:
     *           volumeOrders:
     *             type: array
     *             items:
     *               type: object
     *               properties:
     *                 volumeId:
     *                   type: integer
     *                   format: int64
     *                 orderNum:
     *                   type: integer
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 排序成功
     *       600:
     *         description: 参数错误
     *       500:
     *         description: 服务器错误
     */
    "post /reorder": async (ctx) => {
        const param = await parseJsonFromBodyData(ctx, ["volumeOrders"]);
        if (!param) return;

        try {
            const success = await BookMaker.UpdateVolumeOrder(param.volumeOrders);
            new ApiResponse(success).toCTX(ctx);
        } catch (error) {
            new ApiResponse(null, `更新卷排序失败: ${error.message}`, 50000).toCTX(ctx);
        }
    }

});