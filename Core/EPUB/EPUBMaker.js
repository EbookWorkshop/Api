const EPUB = require("epub-gen");
const Do2Po = require("../OTO/DO");
const path = require("path");
const fs = require("fs/promises");
const sharp = require("sharp");     //提供图像格式转换
const { dataPath } = require("../../config");
const { version } = require("../../package.json");

/*
    const option = {
        title: "爱丽丝梦游仙境", // *必需，书籍标题。
        author: "刘易斯·卡罗尔", // *必需，作者名字。
        publisher: "麦克米伦公司", // 可选
        cover: "https://www.alice-in-wonderland.net/wp-content/uploads/1book1.jpg", // URL 或文件路径，均可。
        content: [
            {
                title: "关于作者", // 可选
                author: "约翰·多伊", // 可选
                data: "<h2>查尔斯·路特维奇·道奇森</h2>"
                +"<div lang=\"en\">更广为人知的笔名是刘易斯·卡罗尔...</div>" // 传递 HTML 字符串
            },
            {
                title: "掉进兔子洞",
                data: "<p>爱丽丝开始感到非常疲倦...</p>"
            },
            {
                ...
            }
            ...
        ]
    };
    new EPUB(option).promise.then(
        () => console.log("电子书生成成功！"),
        err => console.error("由于 ", err, " 生成电子书失败")
    );
*/

class EPUBMaker {
    static async MakeEPUBFile(bookId, showChapters, fontFamily, embedTitle = true) {
        let ebook = await Do2Po.GetEBookById(bookId);
        if (ebook == null) return null;

        if (!showChapters || showChapters.length <= 0) {
            showChapters = ebook.Index.map(item => item.IndexId);
        }
        await ebook.SetShowChapters(showChapters);

        let option = {
            title: ebook.BookName, // *必需，书籍标题。
            author: ebook.Author || "佚名", // *必需，作者名字。
            appendChapterTitles: embedTitle,
            lang: "zh",
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
                if (option.cover.endsWith(".webp")) {
                    const tempFile = path.join(option.tempDir, ebook.BookName + ".png");
                    await sharp(option.cover).png().toFile(tempFile);
                    option.cover = tempFile;
                    useTempCover = true;
                }
            } else {
                option.cover = ebook.CoverImg;
            }
        }

        //加入简介
        await ebook.LoadIntroduction();
        if (ebook.Introduction) {
            option.content.push({
                title: "简介",
                data: "<p>" + ebook.Introduction.split("\n").join("</p>\n<p>") + "</p>",
                // TODO: iPhone 图书应用直接不会显示
                excludeFromToc: true,//不加入目录
                beforeToc: true,//先于目录之前显示: 
            });
        }

        for (let i of ebook.showIndexId) {
            let c = ebook.GetChapter(i);
            let content = c.Content ?? "--当前章节内容缺失--";
            let p = content.split("\n").join("</p>\n<p>");
            option.content.push({
                title: c.Title,
                data: "<p>" + p + "</p>"
            });
        }

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
