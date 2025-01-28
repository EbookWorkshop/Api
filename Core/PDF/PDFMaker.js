const PDFToolkit = require("./PDFToolkit")
const EventManager = require("./../EventManager");

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
        const fileInfo = {
            filename: this.pdf.BookName + ".pdf",
            path: "./Data/Books/" + this.pdf.BookName + '.pdf',      //TODO:路径不存在时会报错、书名含非系统命名规范时会报错
            chapterCount: this.pdf.showIndexId.length           //含有多少章
        };
        return new Promise(async (resolve, reject) => {
            try {
                //创建一个写入对象 `{ doc, stream }`
                const { doc: pdfDoc, stream: fileStream } = PDFToolkit.CreateNewDocFile(fileInfo.path, this.GetSettingFromPdf());

                await PDFToolkit.AddBookCoverToPdf(this.pdf, pdfDoc);//制作封面

                await PDFToolkit.AddChaptersToPdf(this.pdf, pdfDoc);

                //关闭结束文档
                pdfDoc.text("（完）", this.pdf.paddingX, this.pdf.paddingY, { width: this.pdf.pageWidth });
                pdfDoc.end();

                fileStream.on('finish', function () {
                    new EventManager().emit("PDFMaker.CreateBook.Finish", fileInfo);
                    resolve(fileInfo);
                });

                fileStream.on('error', function (err) {
                    new EventManager().emit("PDFMaker.CreateBook.Fail", err.message, fileInfo.filename, fileInfo.path);
                    reject(err);
                });
            } catch (e) {
                new EventManager().emit("Debug.PDFMaker.MakePDF.Fail", e.message, fileInfo.filename, fileInfo.path)
                reject(e);
            }
        });
    }

    GetSettingFromPdf() {
        let { FontFamily, FontSize } = this.pdf;
        return { fontFamily: FontFamily, fontSize: FontSize };
    }
}

module.exports = PDFMaker;