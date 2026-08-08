import path from "node:path";
import fsPromises from "node:fs/promises";
import { parseJsonFromBodyData } from "../../Core/Server.js";
import ApiResponse from "../../Entity/ApiResponse.js";
import { SendAMail } from "../../Core/services/email.js";
import { config } from "../../Core/services/config.js";
import BookMaker from "../../Core/Book/BookMaker.js";
import EPUBMaker from "../../Core/EPUB/EPUBMaker.js";
import PDFMaker from "../../Core/PDF/PDFMaker.js";
import Serialize from "../../Core/Utils/Serialize.js";

const { dataPath, FOLDER } = config;

export default {
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
     *             isExportToInventory:
     *               type: boolean
     *             embedTitle:
     *               type: boolean
     *             embedBookName:
     *               type: boolean
     *             enableIndent:
     *               type: boolean
     *             fontFamily:
     *               type: string
     *             coverImageData:
     *               type: string
     *             chapterIds:
     *               type: array
     *               items:
     *                 type: integer
     *                 format: int32
     *             volumeIds:
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
        if (!param) return new ApiResponse(false, "参数错误，参数类型错误", 60000).toCTX(ctx);
        const { sendByEmail, bookId, volumeIds, chapterIds, isExportToInventory, ...setting } = param;
        await PDFMaker.MakePdfFile(bookId, volumeIds, chapterIds, setting).then(async (rsl) => {
            if (sendByEmail) {
                await SendAMail({
                    title: rsl.filename,
                    content: rsl.filename,
                    files: [rsl.path]
                });
            }
            if (isExportToInventory) {
                const bookDir = path.join(dataPath, FOLDER.BookStorage);
                await fsPromises.copyFile(rsl.path, path.join(bookDir, rsl.filename));
            }
            const relativePath = path.relative(dataPath, rsl.path);
            new ApiResponse({ book: rsl, chapterIds: rsl.chapterIds, download: relativePath }).toCTX(ctx);
        }).catch((err) => {
            new ApiResponse(err, `生成PDF${sendByEmail ? "并发送邮件" : ""}出错：` + (err.message || err), 50000).toCTX(ctx);
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
     *             isExportToInventory:
     *               type: boolean
     *             embedTitle:
     *               type: boolean
     *             fontFamily:
     *               type: string
     *             coverImageData:
     *               type: string
     *             chapterIds:
     *               type: array
     *               items:
     *                 type: integer
     *                 format: int32
     *             volumeIds:
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
        const { sendByEmail, bookId, volumeIds, chapterIds, embedTitle, enableIndent, isExportToInventory } = param;
        if (!param) return new ApiResponse(false, "参数错误，参数类型错误", 60000).toCTX(ctx);

        await BookMaker.MakeTxtFile(bookId, volumeIds, chapterIds, embedTitle, enableIndent).then(async (rsl) => {
            if (sendByEmail) {
                await SendAMail({
                    title: rsl.filename,
                    content: rsl.filename,
                    files: [rsl.path]
                });
            }
            if (isExportToInventory) {
                const bookDir = path.join(dataPath, FOLDER.BookStorage);
                await fsPromises.copyFile(rsl.path, path.join(bookDir, rsl.filename));
            }
            const relativePath = path.relative(dataPath, rsl.path);
            new ApiResponse({ book: rsl, chapterIds: rsl.chapterIds, download: relativePath }).toCTX(ctx);
        }).catch((err) => {
            new ApiResponse(Serialize.Error(err), `生成Txt${sendByEmail ? "并发送邮件" : ""}出错：` + err.message, 50000).toCTX(ctx);
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
     *             isExportToInventory:
     *               type: boolean
     *             embedTitle:
     *               type: boolean
     *             embedBookName:
     *               type: boolean
     *             fontFamily:
     *               type: string
     *             coverImageData:
     *               type: string
     *             chapterIds:
     *               type: array
     *               items:
     *                 type: integer
     *                 format: int32
     *             volumeIds:
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
        if (!param) return new ApiResponse(false, "参数错误，参数类型错误", 60000).toCTX(ctx);

        const { sendByEmail, bookId, volumeIds, chapterIds, isExportToInventory, ...setting } = param;
        await EPUBMaker.MakeEPUBFile(bookId, volumeIds, chapterIds, setting).then(async (rsl) => {
            if (sendByEmail) {
                await SendAMail({
                    title: rsl.filename,
                    content: rsl.filename,
                    files: [rsl.path]
                });
            }
            if (isExportToInventory) {
                const bookDir = path.join(dataPath, FOLDER.BookStorage);
                await fsPromises.copyFile(rsl.path, path.join(bookDir, rsl.filename));
            }
            const relativePath = path.relative(dataPath, rsl.path);
            new ApiResponse({ book: rsl, chapterIds: rsl.chapterIds, download: relativePath }).toCTX(ctx);
        }).catch((err) => {
            new ApiResponse(err, `生成EPUB${sendByEmail ? "并发送邮件" : ""}出错：` + (err.message || err), 50000).toCTX(ctx);
        });
    },
};