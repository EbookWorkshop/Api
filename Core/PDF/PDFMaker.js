const DO = require("./../../Core/OTO/DO");

const EventManager = require("./../EventManager");
const path = require("path");
const { dataPath } = require("../../config");
const { GetDefaultFont } = require("./../services/font")
const WorkerPool = require("./../Worker/WorkerPool");
const wPool = WorkerPool.GetWorkerPool();

class PDFMaker {
    /**
     * 按当前内容制作Pdf的文件
     */
    static async MakePdfFile(bookId, showChapters, setting) {
        let { fontFamily, embedTitle = true, enableIndent } = setting;
        let ebook = await DO.GetPDFById(bookId);
        if (fontFamily) ebook.FontFamily = fontFamily;
        if (!showChapters || showChapters.length == 0) {
            showChapters = ebook.Index.map(item => item.IndexId);
        }
        await ebook.SetShowChapters(showChapters);
        await ebook.LoadIntroduction();

        const pdf = Object.keys(ebook)
            .filter(key => typeof ebook[key] !== 'function')
            .reduce((obj, key) => {
                obj[key] = ebook[key];
                return obj;
            }, {});
        const fileInfo = {
            filename: ebook.BookName + ".pdf",
            path: path.join(dataPath, "Output", ebook.BookName + '.pdf'),
            pdf,
            embedTitle,
            enableIndent,
            chapterCount: ebook.showIndexId.length,           //含有多少章
            defaultFont: await GetDefaultFont()
        };

        return new Promise(async (resolve, reject) => {
            wPool.RunTask({
                taskfile: "@/Core/PDF/MakePdfFile",
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

module.exports = PDFMaker;