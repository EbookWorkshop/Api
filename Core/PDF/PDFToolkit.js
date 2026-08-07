import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";     //提供图像格式转换
import PDFDocument from 'pdfkit';  //http://pdfkit.org

import Volume from "../../Entity/Ebook/Volume.js";
import { config } from "../services/config.js";
import { CheckAndMakeDir } from "../Server.js";

const FONT_PATH = path.join(config.dataPath, config.FOLDER.font);

/**
 * 生成一个PDF文件
 * @param {string} filepath 生成的文件路径
 * @param {{fontFamily,fontSize,defaultFont}} setting 设置
 * @returns {{PDFDocument,stream.Writable}} { doc="pdf文档对象", stream="文件写入流" }
 */
export async function CreateNewDocFile(filepath, setting) {
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
export async function CreateNewDoc(setting, defaultText = null) {
    const doc = new PDFDocument();

    //嵌入字体
    let fontPath = path.join(FONT_PATH, setting.fontFamily || setting.defaultFont);
    try {
        await fs.promises.access(fontPath)
    } catch (err) {
        const { FindFile } = await import("./../services/file.mjs");
        let fontent = await FindFile(FONT_PATH, setting.fontFamily);
        if (fontent) fontPath = path.join(fontent.parentPath, fontent.name);
    }
    doc.font(fontPath);
    doc.fontSize(setting.fontSize || 24);

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
export async function AddIntrocutionToPdf(pdfBook, pdfDoc) {
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
export async function AddChaptersToPdf(pdfBook, pdfDoc, setting) {
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
export async function AddBookCoverToPdf(pdfBook, pdfDoc) {
    let imgFile = null;
    let realDir = null;
    if (pdfBook.CoverImg && !pdfBook.CoverImg.startsWith("#") && !pdfBook.embedBookName) {//读取本地配置的图片为封面
        realDir = path.join(config.dataPath, pdfBook.CoverImg);
        imgFile = realDir;
        if (realDir.endsWith(".webp")) {
            imgFile = realDir.replace(/webp$/, "png");
            await sharp(realDir).png().toFile(imgFile);
        }
    } else if (pdfBook.coverImageData) {        //前端截图传入的Base64数据为封面
        imgFile = Buffer.from(pdfBook.coverImageData, 'base64');
    }

    pdfDoc.image(imgFile, 0, 0, { width: pdfBook.pageWidth || 580, align: 'center', valign: 'center' }).addPage();//TODO：pdf默认尺寸的设置

    if (imgFile && realDir && imgFile != realDir) {
        fs.unlink(imgFile, () => { });
    }
}