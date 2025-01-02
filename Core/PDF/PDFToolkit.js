// const stream = require("node:stream")
const PDFDocument = require('pdfkit');  //http://pdfkit.org
const fs = require('fs');
const path = require('path');
const config = require("./../../config");
const sharp = require("sharp");     //提供图像格式转换

/**
 * 生成一个PDF文件
 * @param {string} filepath 生成的文件路径
 * @param {{fontFamily,fontSize}} setting 设置
 * @returns {{PDFDocument,stream.Writable}} { doc="pdf文档对象", stream="文件写入流" }
 */
function CreateNewDocFile(filepath, setting) {
    const stream = fs.createWriteStream(filepath);
    const doc = CreateNewDoc(setting);
    doc.pipe(stream);
    return { doc, stream };
}

/**
 * 创建一个PDF文档
 * @param {{fontFamily,fontSize}} setting 设置
 * @param {string} defaultText 默认用于显示的文档
 * @returns {PDFDocument} PDF文档对象
 */
function CreateNewDoc(setting, defaultText = null) {
    const doc = new PDFDocument();
    if (!setting.fontFamily.includes(".")) setting.fontFamily += ".ttf";//只有字体名的时候默认加上ttf文件类型
    doc.font(path.join(config.fontPath, setting.fontFamily));
    doc.fontSize(setting.fontSize);

    if (defaultText) {      //如果有文本则直接加入
        doc.text(defaultText,
            setting.paddingX || 10,
            setting.paddingY || 10,
            { width: setting.pageWidth || 580 }
        ).end();
    }

    return doc;
}

/**
 * 将范围内的章节加入到pdf文档文件中
 * @param {PDFBook} pdfBook PDFBook 电子书对象
 * @param {PDFDocument} pdfDoc pdf文档对象
 */
async function AddChaptersToPdf(pdfBook, pdfDoc) {
    for (let cId of pdfBook.showIndexId.values()) {
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
 * @param {PDFBook} pdfBook 电子书
 * @param {PDFDocument} pdfDoc pdf对象
 */
async function AddBookCoverToPdf(pdfBook, pdfDoc) {
    if (pdfBook.CoverImg && !pdfBook.CoverImg.startsWith("#"))      //#开头的为线装本封面底色
        await CreateImageCover(pdfBook, pdfDoc);
    //TODO：做一个线装本封面
}

/**
 * 用图片生成一个封面
 * @param {*} pdfBook 
 * @param {*} pdfDoc 
 */
async function CreateImageCover(pdfBook, pdfDoc) {
    const realDir = path.join(config.dataPath, pdfBook.CoverImg);

    let imgFile = realDir;
    if (realDir.endsWith(".webp")) {
        imgFile = realDir.replace(/webp$/, "png");
        await sharp(realDir).png().toFile(imgFile);
    }

    pdfDoc.image(imgFile, 0, 0, { width: pdfBook.pageWidth, align: 'center', valign: 'center' }).addPage();

    if (imgFile != realDir) {
        fs.unlink(imgFile, () => { });
    }
}

module.exports = {
    /**
     * 创建一个PDF文档
     * @param {{fontFamily,fontSize}} setting 设置
     * @param {string} defaultText 默认用于显示的文档
     * @returns {PDFDocument} PDF文档对象
     */
    CreateNewDoc,
    /**
     * 生成一个PDF文件
     * @param {string} filepath 生成的文件路径
     * @param {{fontFamily,fontSize}} setting 设置
     * @returns {{PDFDocument,stream.Writable}} { doc="pdf文档对象", stream="文件写入流" }
     */
    CreateNewDocFile,
    /**
     * 制作封面
     * @param {PDFBook} pdfBook 电子书
     * @param {PDFDocument} pdfDoc pdf对象
     */
    AddBookCoverToPdf,
    /**
     * 将范围内的章节加入到pdf文档文件中
     * @param {PDFBook} pdfBook PDFBook 电子书对象
     * @param {PDFDocument} pdfDoc pdf文档对象
     */
    AddChaptersToPdf,
}