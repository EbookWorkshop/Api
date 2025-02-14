/**
 * 负责制作书，将书入库
 */
;
const Ebook = require("../../Entity/Ebook/Ebook");
const Index = require("../../Entity/Ebook/Index");
const Chapter = require("../../Entity/Ebook/Chapter");
const Do2Po = require("../OTO/DO");
const path = require("path");
const { dataPath } = require("../../config");
const fs = require('fs');
const { CheckAndMakeDir } = require("./../Server")

class BookMaker {
    /**
     * 添加一本`TXT`书
     * @param {{
     * bookName:string,
     * chapters:Chapter[], //该书包含的章节
     * author:string,
     * conver:string}} book 书的配置
     */
    static async AddATxtBook({
        bookName, chapters, author, conver
    }) {

        let ebook = new Ebook({
            BookName: bookName,
            Author: author,
            CoverImg: conver,
        });

        for (let c of chapters) {
            ebook.Index.push(new Index({
                Title: c.Title,
                OrderNum: c.OrderNum,
                HasContent: c.Content?.length > 0,
            }));
            ebook.Chapters.set(c.Title.trim(), c.Content);
        }

        return await Do2Po.EBookObjToModel(ebook);//持久化
    }

    /**
    * 创建一本空的书
    * @param {{
    * bookName:string,
    * author:string,
    * conver:string
    * }} book 书的配置
    */
    static async CreateEmptyBook({
        bookName, author, conver
    }) {
        let ebook = new Ebook({
            BookName: bookName,
            Author: author,
            CoverImg: conver || "#212f30",//灰色封面
        });

        return await Do2Po.EBookObjToModel(ebook);
    }

    /**
     * 生成一个Txt的文件
     * @param {number} bookId 书ID 
     * @param {Array<number>?} showChpaters 需要包含的章节ID，不传则为全部
     * @param {boolean} embedTitle 是否嵌入标题 
     * @returns 
     */
    static async MakeTxtFile(bookId, showChpaters, embedTitle = true) {
        let ebook = await Do2Po.GetEBookById(bookId);
        if (ebook == null) return null;

        if (!showChpaters || showChpaters.length <= 0) {
            showChpaters = ebook.Index.map(item => item.IndexId);
        }
        await ebook.SetShowChapters(showChpaters);

        return new Promise((resolve, reject) => {
            const fileInfo = {
                filename: ebook.BookName + ".txt",
                path: path.join(dataPath, "Output", ebook.BookName + '.txt'),
                chapterCount: ebook.showIndexId.length           //含有多少章
            };

            CheckAndMakeDir(fileInfo.path);
            const writeStream = fs.createWriteStream(fileInfo.path);
            writeStream.on('error', function (err) {
                reject(err);
            });
            writeStream.on('finish', function () {
                resolve(fileInfo);
            });
            const author = ebook.Author ? `作者：${ebook.Author}\n` : '佚名';
            writeStream.write(`${ebook.BookName}\n${author}\n`);

            for (let i of ebook.Index) {
                let c = ebook.Chapters.get(i.Title);
                if (embedTitle) writeStream.write(`${i.Title}\n${c.Content}\n\n`);
                else writeStream.write(`${c.Content}\n`);
            }
            writeStream.end();
        });
    }
}
module.exports = BookMaker;
