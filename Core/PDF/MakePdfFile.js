//创建一个PDF文件
const PDFToolkit = require("./PDFToolkit")
// const EventManager = require("./../EventManager");
// const path = require("path");
// const { dataPath } = require("../../config");

/**
 * 
 * @param {*} fileInfo 
 */
async function MakePdfFile(fileInfo) {
    /*
            const fileInfo = {
                filename: this.pdf.BookName + ".pdf",
                path: path.join(dataPath, "Output", this.pdf.BookName + '.pdf'),
                pdf,
                chapterCount: this.pdf.showIndexId.length           //含有多少章
            };    
    */
    // console.log(fileInfo, "pdfInfo");
    return new Promise(async (resolve, reject) => {
        const thePdf = fileInfo.pdf;
        let { FontFamily, FontSize } = thePdf;
        const pdfSetting = { fontFamily: FontFamily, fontSize: FontSize };

        const { doc: pdfDoc, stream: fileStream } = PDFToolkit.CreateNewDocFile(fileInfo.path, pdfSetting);

        await PDFToolkit.AddBookCoverToPdf(thePdf, pdfDoc);//制作封面
        await PDFToolkit.AddChaptersToPdf(thePdf, pdfDoc);

        //关闭结束文档
        pdfDoc.text("（完）", thePdf.paddingX, thePdf.paddingY, { width: thePdf.pageWidth });
        pdfDoc.end();

        fileStream.on('finish', function () {
            // new EventManager().emit("PDFMaker.CreateBook.Finish", fileInfo);
            console.log("完成PDF制作 PDFMaker.CreateBook.Finish")
            resolve(fileInfo);
        });

        fileStream.on('error', function (err) {
            // new EventManager().emit("PDFMaker.CreateBook.Fail", err.message, fileInfo.filename, fileInfo.path);
            console.log("PDF制作失败 PDFMaker.CreateBook.Fail")
            reject(err);
        });
    });
}


async function RunTask(param) {
    param.fileInfo.pdf.GetChapter = (cId) => {
        let iObj = param.fileInfo.pdf.Index.filter(i => i.IndexId === cId);
        if (iObj.length <= 0) return null;
        return param.fileInfo.pdf.Chapters.get(iObj[0].Title);
    }

    return await MakePdfFile(param.fileInfo)
}




module.exports = {
    RunTask
}