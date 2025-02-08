const PDFToolkit = require("./PDFToolkit")
/**
 * 创建一个PDF文件
 * @param {*} fileInfo 
 */
async function MakePdfFile(fileInfo) {
    return new Promise(async (resolve, reject) => {
        try {
            const thePdf = fileInfo.pdf;
            let { FontFamily, FontSize } = thePdf;
            const pdfSetting = { fontFamily: FontFamily, fontSize: FontSize };

            const { doc: pdfDoc, stream: fileStream } = await PDFToolkit.CreateNewDocFile(fileInfo.path, pdfSetting);
            await PDFToolkit.AddBookCoverToPdf(thePdf, pdfDoc);//制作封面
            await PDFToolkit.AddChaptersToPdf(thePdf, pdfDoc, fileInfo.embedTitle);

            //关闭结束文档
            pdfDoc.text("（完）", { align: 'center' }).moveDown();
            pdfDoc.end();

            fileStream.on('finish', () => { resolve(fileInfo); });
            fileStream.on('error', (err) => { reject(err); });
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * 创建一个PDF文件     
 * 注意，当前实例将运行在线程中
 * @param {*} param 
 * @returns 
 */
async function RunTask(param) {
    if (!param.fileInfo.pdf.GetChapter)
        param.fileInfo.pdf.GetChapter = function (cId) {
            let iObj = this.Index.filter(i => i.IndexId === cId);
            if (iObj.length <= 0) return null;
            return this.Chapters.get(iObj[0].Title);
        }

    return await MakePdfFile(param.fileInfo)
}

module.exports = {
    RunTask
}