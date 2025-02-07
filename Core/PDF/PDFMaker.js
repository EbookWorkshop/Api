// const PDFToolkit = require("./PDFToolkit")
const EventManager = require("./../EventManager");
const path = require("path");
const { dataPath } = require("../../config");
const WorkerPool = require("./../Worker/WorkerPool");
const wPool = WorkerPool.GetWorkerPool();

class PDFMaker {
    constructor(pdf) {
        this.pdf = pdf;     //书本身
    }

    /**
     * 获取pdf包含的章节 用于制作非完整册子
     * @param {Array} cIds 
     * @returns 
     */
    async SetShowChapters(cIds) {
        return await this.pdf.SetShowChapters(cIds);
    }

    /**
     * 按当前内容制作Pdf的文件
     */
    async MakePdfFile() {
        const pdf = Object.keys(this.pdf)
            .filter(key => typeof this.pdf[key] !== 'function')
            .reduce((obj, key) => {
                obj[key] = this.pdf[key];
                return obj;
            }, {});
        const fileInfo = {
            filename: this.pdf.BookName + ".pdf",
            path: path.join(dataPath, "Output", this.pdf.BookName + '.pdf'),
            pdf,
            chapterCount: this.pdf.showIndexId.length           //含有多少章
        };

        return new Promise(async (resolve, reject) => {
            wPool.RunTask({
                taskfile: "@/Core/PDF/MakePdfFile",
                param: {
                    fileInfo
                },
                taskType: "MakePdfFile",
            }, async (result, err) => {
                console.log("pdf-make-result", result, err);
                if (result && !err) resolve(result);
                else reject(err);
            });
        });
    }

    // GetSettingFromPdf() {
    //     let { FontFamily, FontSize } = this.pdf;
    //     return { fontFamily: FontFamily, fontSize: FontSize };
    // }
}

module.exports = PDFMaker;