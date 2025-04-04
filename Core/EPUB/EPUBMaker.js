const EPUB = require("epub-gen");
// const Ebook = require("../../Entity/Ebook/Ebook");
const Do2Po = require("../OTO/DO");
const path = require("path");
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
    static async MakeEPUBFile(bookId, showChpaters, fontFamliy, embedTitle) {
        let ebook = await Do2Po.GetEBookById(bookId);
        if (ebook == null) return null;

        if (!showChpaters || showChpaters.length <= 0) {
            showChpaters = ebook.Index.map(item => item.IndexId);
        }
        await ebook.SetShowChapters(showChpaters);

        let option = {
            title: ebook.BookName, // *必需，书籍标题。
            author: ebook.Author || "佚名", // *必需，作者名字。
            appendChapterTitles: embedTitle,
            lang: "zh",
            tocTitle: "目  录",//默认 Table Of Contents
            publisher: `EBook Workshop v${version}`, // 可选
            // cover: "https://www.alice-in-wonderland.net/wp-content/uploads/1book1.jpg", // URL 或文件路径，均可。
            content: []
        }
        if (ebook.CoverImg && !ebook.CoverImg.startsWith("#")) {
            if (ebook.CoverImg.startsWith("/") || ebook.CoverImg.startsWith("\\")) {
                option.cover = path.resolve(path.join(dataPath, ebook.CoverImg));
            } else {
                option.cover = ebook.CoverImg;
            }
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
                    () => resolve({ path: output }),
                    err => reject(err)
                );
        })
    }
}

module.exports = EPUBMaker;
