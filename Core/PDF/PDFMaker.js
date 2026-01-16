const DO = require("./../../Core/OTO/DO");

const EventManager = require("./../EventManager");
const path = require("path");
const { dataPath } = require("../../config");
const { GetDefaultFont } = require("./../services/font")
const WorkerPool = require("./../Worker/WorkerPool");
const wPool = WorkerPool.GetWorkerPool();
const FindMyChapters = require("./../Book/FindMyChapters");

class PDFMaker {
    /**
     * 按当前内容制作Pdf的文件
     * 先判断volumes，不为空则按卷生成书；若空则按showChapters生成指定章节；若showChapters为空则按生成全书
     * @param {number} bookId 书籍ID
     * @param {Array<number>?} volumes 要显示的卷ID数组
     * @param {Array<number>?} showChapters 要显示的章节ID数组
     * @param {*} setting 其他设置
     */
    static async MakePdfFile(bookId, volumes, showChapters, setting) {
        let { fontFamily, embedTitle = true, enableIndent, coverImageData } = setting;
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
            path: path.join(dataPath, "Output", ebook.BookName + '.pdf'),
            pdf,
            embedTitle,
            enableIndent,
            chapterCount: ebook.showIndexId.length,           //含有多少章
            defaultFont: await GetDefaultFont(),
            coverImageData,
            chapterIds: showIndexId,
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