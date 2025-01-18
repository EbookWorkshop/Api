const DO = require("./index");
const Ebook = require("../../../Entity/Ebook/Ebook");


class OTO_Ebook {


    /**
     * 获取图书列表
     */
    static async GetBookList() {
        const myModels = new Models();
        let bookListModels = await myModels.Ebook.findAll({ order: [["id", "DESC"]] });
        let bookList = [];
        for (let b of bookListModels) {
            bookList.push(new Ebook({ ...b.dataValues }));
        }
        return bookList;
    }

    /**
     * Ebook 持久化
     * @param {*} book 
     * @returns 
     */
    static async EBookObjToModel(book) {
        let tbook = await DO.GetEBookByName(book.BookName);
        if (tbook != null) DO.DeleteOneBook(tbook.BookId);//已有同名的书先删除 -- 以覆盖方式导入书籍

        if (!book.CoverImg) book.CoverImg = "#f2e3a4";//设定白锦封面
        let PO = Models.GetPO();
        let poBook = await PO.Ebook.create({
            ...book
        });

        for (let i of book.Index) {
            let result = await poBook.createEbookIndex({ ...i, Content: book.Chapters.get(i.Title) });
        }

        return true;
    }

    /**
     * 根据ID获得对应的EBook对象
     * @param {*} bookId 
     * @returns Ebook
     */
    static async GetEBookById(bookId) {
        const myModels = new Models();
        let book = await myModels.Ebook.findByPk(bookId);
        if (book == null) return null;
        return await DO.ModelToEBook(book);
    }
    /**
     * 通过书名查找书
     * @param {*} name 书名（强制去除空格）
     * @returns {Ebook}
     */
    static async GetEBookByName(name) {
        const myModels = new Models();
        let book = await myModels.Ebook.findOne({ where: { bookName: name.trim() } });
        if (book == null) return null;
        return await DO.ModelToEBook(book);
    }

    /**
     * 根据ID获得对应的 章节对象
     * @param {*} chapterId 章节ID
     * @returns 章节
     */
    static async GetEBookChapterById(chapterId) {
        const myModels = new Models();
        let chapter = await myModels.EbookIndex.findByPk(chapterId);
        if (chapter == null) return null;
        let book = await chapter.getEbook();
        let rules = await DO.GetReviewRules(chapter.BookId);
        let chapterObj = new Chapter({ ...chapter.dataValues });
        [chapterObj.Title, chapterObj.Content] = Reviewer(rules, [chapterObj.Title, chapterObj.Content]);
        chapterObj.Book = book.dataValues;
        return chapterObj;
    }

    /**
     * 获取当前章节的相邻章节ID
     * @param {*} chapterId 
     * @returns 
     */
    static async GetEBookChapterNext(chapterId) {
        const myModels = new Models();
        let chapter = await myModels.EbookIndex.findOne({
            attributes: ["BookId", "OrderNum"],
            where: { id: chapterId }
        });
        if (chapter == null) return null;

        let { OrderNum, BookId } = chapter.dataValues;
        let pre = await myModels.EbookIndex.findOne({
            attributes: ["id"],
            where: {
                bookId: BookId,
                OrderNum: {
                    [Models.Op.lt]: OrderNum
                }
            },
            order: [
                ["OrderNum", "DESC"]
            ]
        });
        let next = await myModels.EbookIndex.findOne({
            attributes: ["id"],
            where: {
                bookId: BookId,
                OrderNum: {
                    [Models.Op.gt]: OrderNum
                }
            },
            order: [
                ["OrderNum", "ASC"]
            ]
        });

        return { pre, next };
    }

    /**
     * PO转换为EBook对象 PO to DO
     * @param {*} ebookModel
     * @returns {EBook}
     */
    static async ModelToEBook(ebookModel) {
        return await DO.ModelToBookObj(ebookModel, Ebook);
    }


    /**
     * 更新章节信息
     * @param {*} chapter 
     */
    static async UpdateChapter(chapter) {
        if (chapter.IndexId * 1 !== chapter.IndexId) return;

        const myModels = new Models();
        let cid = chapter.IndexId;
        delete chapter.IndexId;
        let rsl = await myModels.EbookIndex.update(chapter, { where: { id: cid } });
        return rsl;
    }
}


module.exports = OTO_Ebook;