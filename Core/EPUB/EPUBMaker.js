const EPUB = require("epub-gen");
const Do2Po = require("../OTO/DO");
const path = require("path");
const fs = require("fs/promises");
const sharp = require("sharp");     //提供图像格式转换
const { dataPath } = require("../../config");
const { version } = require("../../package.json");


class EPUBMaker {
    /**
     * 生成EPUB文件
     * @param {*} bookId 书籍ID
     * @param {*} showChapters 要显示的章节ID数组，为空则显示全部
     * @param {*} setting 其它配置
     * @returns {Promise<{path:string}>} 生成的EPUB文件路径
     */
    static async MakeEPUBFile(bookId, showChapters, setting) {
        let ebook = await Do2Po.GetEBookById(bookId);
        if (ebook == null) return null;

        let { fontFamily, embedTitle = true, enableIndent } = setting;

        if (!showChapters || showChapters.length <= 0) {
            showChapters = ebook.Index.map(item => item.IndexId);
        }
        await ebook.SetShowChapters(showChapters);

        let option = {
            title: ebook.BookName, // *必需，书籍标题。
            author: ebook.Author || "佚名", // *必需，作者名字。
            appendChapterTitles: embedTitle,//是否在章节内容前面添加章节标题
            lang: "zh",
            css: "",
            tocTitle: "目  录",//默认 Table Of Contents
            publisher: `EBook Workshop v${version}`, // 可选
            // cover: "https://www.alice-in-wonderland.net/wp-content/uploads/1book1.jpg", // URL 或文件路径，均可。
            content: [],
            tempDir: path.join(dataPath, "temp/EPUB"),//非标配置，指定打包EPUB文件用的临时目录
        }
        //临时目录不存在则创建
        try {
            await fs.access(option.tempDir);
        } catch {
            await fs.mkdir(option.tempDir, { recursive: true });
        }

        let useTempCover = false;
        if (ebook.CoverImg && !ebook.CoverImg.startsWith("#")) {
            if (ebook.CoverImg.startsWith("/") || ebook.CoverImg.startsWith("\\")) {
                option.cover = path.resolve(path.join(dataPath, ebook.CoverImg));

                //进行文件格式兼容
                if (option.cover.endsWith(".webp") || option.cover.endsWith(".jpg")) {
                    const tempFile = path.join(option.tempDir, ebook.BookName + ".png");
                    await sharp(option.cover).png().toFile(tempFile);
                    option.cover = tempFile;
                    useTempCover = true;
                }
            } else {
                option.cover = ebook.CoverImg;
            }
        } else if (setting.coverImageData) {
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
            for (let c of vM.get(e.VolumeId)) {
                let p = c.Content;
                if (enableIndent) {
                    let multiLine = p.split("\n");
                    multiLine = multiLine.map(t => t.trimStart());    //去除行首空格
                    p = multiLine.join("</p>\n<p>");
                }
                option.content.push({
                    title: c.Title,
                    data: `<p>${p}</p>`,
                });
            }
        }

        if (enableIndent) option.css += `\np{ text-indent: 2em;} `;

        let output = path.join(dataPath, "Output", ebook.BookName + '.epub');
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
                    () => resolve({ path: output }),
                    err => reject(err)
                );
        })
    }
}

module.exports = EPUBMaker;
