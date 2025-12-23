const PDFDocument = require('pdfkit');  //http://pdfkit.org
const fs = require('fs');
const path = require('path');
const config = require("./../../config");
const sharp = require("sharp");     //提供图像格式转换
const { CheckAndMakeDir } = require("./../Server");


/**
 * 生成一个PDF文件
 * @param {string} filepath 生成的文件路径
 * @param {{fontFamily,fontSize,defaultFont}} setting 设置
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
            fontent = await FindFile(config.fontPath, setting.defaultFont);//使用默认字体
            if (!fontent) console.warn("PDF嵌入字体跳过，找不到字体：", setting.fontFamily, "生成的文件可能会乱码。");
            else doc.font(path.join(fontent.parentPath, fontent.name));
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
 * 在开始前加入简介章节
 * @param {*} pdfBook 
 * @param {*} pdfDoc 
 * @returns 
 */
async function AddIntrocutionToPdf(pdfBook, pdfDoc) {
    //加入简介
    if (!pdfBook.Introduction) return;

    pdfDoc.text("简介", { align: 'center' }).moveDown();
    pdfDoc.text(pdfBook.Introduction, pdfBook.paddingX, pdfBook.paddingY, { width: pdfBook.pageWidth }).addPage();
}


/**
 * 将范围内的章节加入到pdf文档文件中     
 * 注意：用到了 `pdfBook.GetChapter` 方法，需要pdfBook对象已实现了GetChapter
 * @param {PDFBook|Object} pdfBook PDFBook|Object 电子书对象
 * @param {PDFDocument} pdfDoc pdf文档对象
 * @param {*} setting 文件生成设置
 */
async function AddChaptersToPdf(pdfBook, pdfDoc, setting) {
    let { embedTitle = false, enableIndent = false } = setting;

    let vM = new Map();
    // 按卷分类章节
    for (let i of pdfBook.showIndexId) {
        let c = pdfBook.GetChapter(i);
        if (!vM.has(c.VolumeId)) {
            vM.set(c.VolumeId, new Array());
        }
        vM.get(c.VolumeId).push(c);
    }
    if (vM.has(null)) {
        pdfBook.Volumes.push(new Volume({
            id: null,
            Title: "未分卷章节",
            Introduction: ""
        }));
    }
    for (let e of pdfBook.Volumes) {
        if (!vM.has(e.VolumeId)) continue;
        if (e.VolumeId) {
            pdfDoc.outline.addItem(e.Title);
            pdfDoc.text(e.Title, { align: 'center' }).moveDown();
            pdfDoc.text(e.Introduction, pdfBook.paddingX, pdfBook.paddingY, { width: pdfBook.pageWidth }).addPage();
        }
        for (let c of vM.get(e.VolumeId)) {
            pdfDoc.outline.addItem(c.Title);
            let content = c.Content || `${c.Title}\n当前章节内容缺失。`;

            if (enableIndent) { //加入缩进
                let indent = " ".repeat(pdfBook.indentSize || 4);
                content = content.split("\n").map(line => {
                    const tempTest = line.trimStart();
                    if (tempTest.length > 0) {
                        return indent + tempTest;
                    }
                    return line;
                }).join("\n");
            }
            if (embedTitle) pdfDoc.text(c.Title, { align: 'center' }).moveDown();
            pdfDoc.text(content, pdfBook.paddingX, pdfBook.paddingY, { width: pdfBook.pageWidth }).addPage();
        }
    }
}

/**
 * 制作封面
 * @param {PDFBook} pdfBook 电子书
 * @param {PDFDocument} pdfDoc pdf对象
 */
async function AddBookCoverToPdf(pdfBook, pdfDoc) {
    let imgFile = null;
    let realDir = null;
    if (pdfBook.CoverImg && !pdfBook.CoverImg.startsWith("#")) {     //#开头的为线装本封面底色
        realDir = path.join(config.dataPath, pdfBook.CoverImg);
        imgFile = realDir;
        if (realDir.endsWith(".webp")) {
            imgFile = realDir.replace(/webp$/, "png");
            await sharp(realDir).png().toFile(imgFile);
        }
    } else if (pdfBook.coverImageData) {        //做一个线装本封面
        imgFile = Buffer.from(pdfBook.coverImageData, 'base64');
    }

    pdfDoc.image(imgFile, 0, 0, { width: pdfBook.pageWidth || 580, align: 'center', valign: 'center' }).addPage();//TODO：pdf默认尺寸的设置

    if (imgFile && realDir && imgFile != realDir) {
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

    /**
     * 在开始前加入简介章节
     * @param {PDFBook} pdfBook PDFBook 电子书对象
     * @param {PDFDocument} pdfDoc pdf文档对象
     */
    AddIntrocutionToPdf,
}