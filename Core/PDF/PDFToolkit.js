const PDFDocument = require('pdfkit');  //http://pdfkit.org
const fs = require('fs');
const path = require('path');
const config = require("./../../config");
const sharp = require("sharp");     //提供图像格式转换
const { CheckAndMakeDir } = require("./../Server");
const { GetDefaultFont } = require("./../services/font");


/**
 * 生成一个PDF文件
 * @param {string} filepath 生成的文件路径
 * @param {{fontFamily,fontSize}} setting 设置
 * @returns {{PDFDocument,stream.Writable}} { doc="pdf文档对象", stream="文件写入流" }
 */
async function CreateNewDocFile(filepath, setting) {
    CheckAndMakeDir(filepath);
    const stream = fs.createWriteStream(filepath);
    const doc = await CreateNewDoc(setting);
    doc.pipe(stream);
    return { doc, stream };
}

/**
 * 创建一个PDF文档
 * @param {{fontFamily,fontSize}} setting 设置
 * @param {string} defaultText 默认用于显示的文档
 * @returns {PDFDocument} PDF文档对象
 */
async function CreateNewDoc(setting, defaultText = null) {
    const doc = new PDFDocument();

    //嵌入字体
    if (setting.fontFamily) {
        const { FindFile } = await import("./../services/file.mjs");
        let fontent = await FindFile(config.fontPath, setting.fontFamily);
        //PDFKit 支持嵌入 TrueType（.ttf）、OpenType（.otf）、WOFF、WOFF2、TrueType 集合（.ttc）和 Datafork TrueType（.dfont）字体。
        if (fontent) doc.font(path.join(fontent.parentPath, fontent.name));
        else {
            let defFont = await GetDefaultFont();
            fontent = await FindFile(config.fontPath, defFont);//使用默认字体
            if (!fontent) console.warn("PDF嵌入字体跳过，找不到字体：", setting.fontFamily, "生成的文件可能会乱码。");
        }
    }

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
 * 注意：用到了 `pdfBook.GetChapter` 方法，需要pdfBook对象已实现了GetChapter
 * @param {PDFBook|Object} pdfBook PDFBook|Object 电子书对象
 * @param {PDFDocument} pdfDoc pdf文档对象
 * @param {boolean} embedTitle 是否嵌入章节标题
 */
async function AddChaptersToPdf(pdfBook, pdfDoc, embedTitle = false) {
    for (let cId of pdfBook.showIndexId.values()) {
        let curContent = pdfBook.GetChapter(cId);

        if (curContent == null) throw ({ message: `找不到章节：ID${cId}。` });

        //加到大纲（pdf的目录）
        pdfDoc.outline.addItem(curContent.Title);

        //加入章节标题
        if (embedTitle) {
            pdfDoc.text(curContent.Title, { align: 'center' }).moveDown();
        }

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