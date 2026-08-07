import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";     //提供图像格式转换
import EPUB from "epub-gen";

import Volume from "../../Entity/Ebook/Volume.js";

import Do2Po from "../OTO/DO/index.js";
import { config } from "../services/config.js";
import packJson from "../../package.json" with {type: "json"};
import { SHOW_BOOKNAME } from "../Book/BookMaker.js"
import { FindMyChapters } from "../Book/FindMyChapters.js";

const { dataPath, FOLDER } = config;
const { version } = packJson;

export default class EPUBMaker {
    /**
     * 生成EPUB文件
     * 先判断volumes，不为空则按卷生成书；若空则按showChapters生成指定章节；若showChapters为空则按生成全书
     * @param {number} bookId 书籍ID
     * @param {Array<number>?} volumes 要显示的卷ID数组
     * @param {Array<number>?} showChapters 要显示的章节ID数组
     * @param {*} setting 其它配置
     * @returns {Promise<{path:string}>} 生成的EPUB文件路径
     */
    static async MakeEPUBFile(bookId, volumes, showChapters, setting) {
        let ebook = await Do2Po.GetEBookById(bookId);
        if (ebook == null) return null;

        if (!setting) setting = {};//邮件批量生成文件发送时，所有配置为空。
        let { embedTitle = true, enableIndent, embedBookName } = setting;

        let chapters = FindMyChapters(ebook, volumes, showChapters);
        await ebook.SetShowChapters(chapters);

        let option = {
            title: ebook.BookName, // *必需，书籍标题。
            author: ebook.Author || "佚名", // *必需，作者名字。
            appendChapterTitles: embedTitle,//是否在章节内容前面添加章节标题
            lang: "zh-CN",
            css: "",
            tocTitle: "目  录",//默认 Table Of Contents
            publisher: `EBook Workshop v${version}`, // 可选
            // cover: "https://www.alice-in-wonderland.net/wp-content/uploads/1book1.jpg", // URL 或文件路径，均可。
            content: [],
            tempDir: path.join(dataPath, FOLDER.TempFile, "EPUB"),//指定打包EPUB文件用的临时目录
        }
        //临时目录不存在则创建
        try {
            await fs.access(option.tempDir);
        } catch {
            await fs.mkdir(option.tempDir, { recursive: true }, () => { });
        }

        //处理封面
        let useTempCover = false;
        if (ebook.CoverImg && !ebook.CoverImg.startsWith("#") && embedBookName == false) {//读系统的图片作封面(系统封面没嵌入书名)
            if (ebook.CoverImg.endsWith(SHOW_BOOKNAME)) ebook.CoverImg = ebook.CoverImg.replace(SHOW_BOOKNAME, "");

            if (ebook.CoverImg.startsWith("/") || ebook.CoverImg.startsWith("\\")) {
                option.cover = path.resolve(path.join(dataPath, ebook.CoverImg));//相对路径的情况下，规格化为绝对路径
            } else {
                option.cover = ebook.CoverImg;
            }

            //转为兼容的PNG格式
            if (option.cover.endsWith(".webp") || option.cover.endsWith(".jpg")) {
                const tempFile = path.join(option.tempDir, ebook.BookName + ".png");
                await sharp(option.cover).png().toFile(tempFile);
                option.cover = tempFile;
                useTempCover = true;
            }
        } else if (setting.coverImageData) {        //前端提供的封面截图
            const tempFile = path.join(option.tempDir, ebook.BookName + ".png");
            await fs.writeFile(tempFile, setting.coverImageData, "base64");
            option.cover = tempFile;
            useTempCover = true;
        }

        //加入简介
        await ebook.LoadIntroduction();
        if (ebook.Introduction) {
            option.content.push({
                title: "简介",
                data: "<p>" + ebook.Introduction.split("\n").join("</p>\n<p>") + "</p>",
                // TODO: iPhone 图书应用直接不会显示
                excludeFromToc: true,//不加入目录
                beforeToc: true,//先于目录之前显示: --不起作用
            });
        }

        let vM = new Map();
        // 按卷分类章节
        for (let i of ebook.showIndexId) {
            let c = ebook.GetChapter(i);
            if (!vM.has(c.VolumeId)) {
                vM.set(c.VolumeId, new Array());
            }
            vM.get(c.VolumeId).push(c);
        }
        if (vM.has(null)) {
            ebook.Volumes.push(new Volume({
                id: null,
                Title: "未分卷章节",
                Introduction: ""
            }));
        }

        for (let e of ebook.Volumes) {
            if (!vM.has(e.VolumeId)) continue;
            //加入卷首页
            if (e.VolumeId) {
                let data = `<p>${e.Introduction}</p>`;
                if (!embedTitle) {
                    data = `<h1 style="text-align: center;">${e.Title}</h1>\n${data}`;
                }
                option.content.push({
                    title: e.Title,
                    data: data,
                });
            }
            //整理章节内容并加入
            for (let c of vM.get(e.VolumeId)) {
                let p = c.Content || "-=章节内容缺失=-";
                let multiLine = p.split("\n");
                if (setting.isCompact) {//紧凑模式，段落之间与平常换行间距一致
                    multiLine = multiLine.map(t => t.trim()).filter(t => t.length > 0);//去除空行
                    if (enableIndent) multiLine = multiLine.map(t => '　　' + t.trimStart());    //缩进的处置
                    p = multiLine.join("<br/>\n");
                } else {//普通段落模式，段落之间间距更大
                    if (enableIndent) multiLine = multiLine.map(t => t.trimStart());    //缩进的处置
                    p = `<p>${multiLine.join("</p>\n<p>")}</p>`;
                }
                option.content.push({
                    title: c.Title,
                    data: p,
                });
            }
        }

        if (enableIndent && !setting.isCompact) option.css += `\np{ text-indent: 2em;} `;//统一加入段落缩进

        const filename = ebook.BookName + ".epub";
        const output = path.join(dataPath, FOLDER.TempBookOutput, filename);
        return new Promise((resolve, reject) => {
            new EPUB(option, output).promise
                .then(
                    () => {
                        if (useTempCover) { //删除临时文件
                            fs.rm(option.cover, { recursive: true, force: true });
                        }
                    }, err => reject(err)
                )
                .then(
                    () => resolve({ path: output, chapterIds: chapters, filename }),
                    err => reject(err)
                );
        })
    }
}
