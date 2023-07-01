/**
 * 负责制作书，将书入库
 */
;
const Ebook = require("../../Entity/Ebook/Ebook");
const Index = require("../../Entity/Ebook/Index");
const Chapter = require("../../Entity/Ebook/Chapter");
const Do2Po = require("../OTO/DO");

class BookMaker {
    /**
     * 添加一本`TXT`书
     * @param {{
     * bookName:string,
     * chapters:Chapter[], 
     * author:string,
     * conver:string}} book 书的配置
     */
    static async AddATxtBook({
        bookName, chapters, author, conver
    }) {
        console.log("准备添加：", bookName, chapters);

        // let book = await Do2Po.GetEBookByName(bookName);
        // if (book != null) Do2Po.DeleteOneBook(book.BookId);//已有同名的书先删除

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

        Do2Po.EBookObjToModel(ebook);
    }

}
module.exports = BookMaker;
