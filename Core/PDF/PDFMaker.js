const PDFDocument = require('pdfkit');  //http://pdfkit.org
const fs = require('fs');
const EventManager = require("./../EventManager");
const { config } = require("./../../config");

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
            path: "./Data/Books/" + this.pdf.BookName + '.pdf'      //TODO:路径不存在时会报错、书名含非系统命名规范时会报错
        };
        return new Promise(async (resolve, reject) => {
            try {
                //创建一个写入对象 `{ doc, stream }`
                const { doc: pdfDoc, stream: fileStream } = CreateNewDoc(fileInfo.path, this.GetSettingFromPdf());

                AddBookCoverToPdf(this.pdf, pdfDoc);//制作封面

                await AddChaptersToPdf(this.pdf, pdfDoc);

                //关闭结束文档
                pdfDoc.text("（完）", this.pdf.paddingX, this.pdf.paddingY, { width: this.pdf.pageWidth });
                pdfDoc.end();

                fileStream.on('finish', function () {
                    new EventManager().emit("PDFBook.CreateBook.Finish", fileInfo);
                    resolve(fileInfo);
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


/**
 * 开启一个PDF文档写入流
 * @param {string} filepath 生成的文件路径
 * @param {{fontFamily,fontSize}} setting 设置
 * @returns {{doc,stream}} { doc="pdf文档对象", stream="文件写入流" }
 */
function CreateNewDoc(filepath, setting) {
    const stream = fs.createWriteStream(filepath);
    const doc = new PDFDocument();
    doc.pipe(stream);

    if (!setting.fontFamily.includes(".")) setting.fontFamily += ".ttf";//只有字体名的时候默认加上ttf文件类型
    doc.font('./Data/font/' + setting.fontFamily);
    doc.fontSize(setting.fontSize);
    return { doc, stream };
}

/**
 * 将范围内的章节加入到pdf文档文件中
 * @param {*} pdfBook PDFBook 电子书对象
 * @param {*} pdfDoc pdf文档对象
 */
async function AddChaptersToPdf(pdfBook, pdfDoc) {
    for (let cId of pdfBook.showIndexId.values()) {
        await pdfBook.ReviewChapter(cId)
        let curContent = pdfBook.GetChapter(cId);

        if (curContent == null) throw ({ message: `找不到章节：ID${cId}。` });
        //加到大纲（pdf的目录）
        pdfDoc.outline.addItem(curContent.Title);


        //如果当前章节没内容，则加入默认提示。
        let txt = curContent.Content;
        if (!txt) {
            txt = `${curContent.Title}\n当前章节内容缺失。`;
        }

        //加入整段正文
        pdfDoc.text(txt, pdfBook.paddingX, pdfBook.paddingY, { width: pdfBook.pageWidth }).addPage();
    }
}

/**
 * 制作封面
 * @param {*} pdfBook 电子书
 * @param {*} pdfDoc pdf对象
 */
function AddBookCoverToPdf(pdfBook, pdfDoc) {
    if (pdfBook.CoverImg) CreateImageCover(pdfBook, pdfDoc);

}

/**
 * 用图片生成一个封面
 * @param {*} pdfBook 
 * @param {*} pdfDoc 
 */
function CreateImageCover(pdfBook, pdfDoc) {
    const realDir = config.dataPath + pdfBook.CoverImg;
    pdfDoc.image(realDir, 0, 0, { width: pdfBook.pageWidth, align: 'center', valign: 'center' }).addPage();
}

module.exports = PDFMaker;