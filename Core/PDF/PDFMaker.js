import path from "node:path";

import DO from "../OTO/DO/index.js";
import { EventManager } from "../EventManager.js";
import { config } from "../services/config.js";
import { GetDefaultReadingFont } from "../services/font.js"
import WorkerPool from "../Worker/WorkerPool.js";
import { FindMyChapters } from "../Book/FindMyChapters.js";

const wPool = WorkerPool.GetWorkerPool();
const { dataPath, FOLDER } = config;
export default class PDFMaker {
    /**
     * 按当前内容制作Pdf的文件
     * 先判断volumes，不为空则按卷生成书；若空则按showChapters生成指定章节；若showChapters为空则按生成全书
     * @param {number} bookId 书籍ID
     * @param {Array<number>?} volumes 要显示的卷ID数组
     * @param {Array<number>?} showChapters 要显示的章节ID数组
     * @param {*} setting 其他设置
     */
    static async MakePdfFile(bookId, volumes, showChapters, setting) {
        let { fontFamily, embedTitle = true, enableIndent, coverImageData, embedBookName } = setting;
        let ebook = await DO.GetPDFById(bookId);
        if (fontFamily) ebook.FontFamily = fontFamily;

        const showIndexId = FindMyChapters(ebook, volumes, showChapters);
        await ebook.SetShowChapters(showIndexId);
        await ebook.LoadIntroduction();

        const pdf = Object.keys(ebook)
            .filter(key => typeof ebook[key] !== 'function')
            .reduce((obj, key) => {
                obj[key] = ebook[key];
                return obj;
            }, {});
        const fileInfo = {
            filename: ebook.BookName + ".pdf",
            path: path.join(dataPath, FOLDER.TempBookOutput, ebook.BookName + '.pdf'),
            pdf,
            embedTitle,
            embedBookName,
            enableIndent,
            chapterCount: ebook.showIndexId.length,           //含有多少章
            defaultFont: await GetDefaultReadingFont(),
            coverImageData,
            chapterIds: showIndexId,
        };

        return new Promise(async (resolve, reject) => {
            wPool.RunTask({
                taskfile: "@/Core/PDF/MakePdfFile.js",
                param: { fileInfo },
                taskType: "MakePdfFile",
            }, async (result, err) => {
                if (result && !err) {
                    new EventManager().emit("PDFMaker.CreateBook.Finish", fileInfo);
                    resolve(result);
                }
                else {
                    new EventManager().emit("PDFMaker.CreateBook.Fail", err.message, fileInfo.filename, fileInfo.path);
                    reject(err);
                }
            });
        });
    }

}
