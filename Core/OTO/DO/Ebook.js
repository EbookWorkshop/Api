const DO = require("./index");
const Ebook = require("../../../Entity/Ebook/Ebook");
const Models = require("./../Models");
const Chapter = require("./../../../Entity/Ebook/Chapter");
const { Run: Reviewer } = require("./../../Utils/ReviewString");

class OTO_Ebook {


    /**
     * 获取电子书列表
     * @param {number} tagid 筛选的标签
     * @param {number[]} nottag 排除的标签
     * @returns 
     */
    static async GetBookList(tagid, nottag) {
        const myModels = Models.GetPO();
        const param = {
            order: [["Hotness", "DESC"], ["id", "DESC"]],
            ...(tagid > 0 && {
                include: [{
                    model: myModels.EbookTag,
                    required: true,     //false：left join
                    where: { TagId: tagid }
                }]
            })
        };

        if (nottag?.length > 0) {
            param.include = null;

            const bookid = await myModels.EbookTag.findAll({
                where: { TagId: { [Models.Op.in]: nottag } },
                attributes: ["BookId"]
            });

            param.where = { id: { [Models.Op.notIn]: bookid.map(b => b.BookId) } };
            // param.logging = console.log;
        }

        const bookListModels = await myModels.Ebook.findAll(param);
        return bookListModels.map(b => new Ebook(b.dataValues));
    }

    /**
     * Ebook 持久化 DO to PO
     * @param {Ebook} book 
     * @returns 
     */
    static async EBookObjToModel(book) {
        const PO = Models.GetPO();
        const t = await PO.BeginTrans(); // 开启事务
        try {
            let existingBook = await DO.GetEBookByName(book.BookName);
            if (existingBook && !existingBook?.CoverImg?.startsWith("#")) {
                book.CoverImg = existingBook.CoverImg; // 继承已有封面
                existingBook.CoverImg = "";
            }
            if (existingBook) await DO.DeleteOneBook(existingBook.BookId, false);//已有同名的书先删除 -- 以覆盖方式导入书籍

            if (!book.CoverImg) book.CoverImg = "#f2e3a4";//设定白锦封面

            let poBook = await PO.Ebook.create({
                ...book
            }, { transaction: t });

            await Promise.all([...book.Index].map(async i =>
                poBook.createEbookIndex({
                    ...i,
                    Content: book.Chapters.get(i.Title)
                }, { transaction: t })
            ));

            await t.commit();
            return true;
        } catch (e) {
            // console.log("存储书失败：", book, e);
            await t.rollback();
            return false;
        }
    }

    /**
     * 根据ID获得对应的EBook对象
     * @param {number} bookId 
     * @returns {Ebook} 
     */
    static async GetEBookById(bookId) {
        const myModels = new Models();
        let book = await myModels.Ebook.findByPk(bookId);
        if (book == null) return null;
        return await DO.ModelToEBook(book);
    }

    /**
     * 获取电子书信息
     * @param {*} bookId 
     * @returns 
     */
    static async GetEBookInfoById(bookId) {
        const myModels = Models.GetPO();
        const book = await myModels.Ebook.findByPk(bookId, {
            attributes: ['id', 'BookName', 'Author', 'CoverImg', 'FontFamily']
        });
        if (book == null) return null;
        //简介：
        let intro = await myModels.EbookIndex.findOne({ where: { BookId: bookId, Title: Chapter.IntroductionName } });
        if (intro == null) return book.dataValues;

        let bookData = book.dataValues;
        bookData.Introduction = intro.Content;
        return bookData;
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
     * 带有校阅功能
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

    static async GetEbookHiddenChapterList(bookid) {
        const myModels = Models.GetPO();
        let hiddenChapters = await myModels.EbookIndex.findAll({
            attributes: ["id", "Title", "BookId"],
            where: {
                BookId: bookid,
                OrderNum: { [Models.Op.lt]: 0 }
            },
            order: [["OrderNum", "ASC"]],
        });
        return hiddenChapters.map(c => new Chapter(c.dataValues));
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
                    [Models.Op.and]: [
                        { [Models.Op.lt]: OrderNum },
                        { [Models.Op.gt]: 0 }
                    ]
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

    /**
     * 更新章节顺序
     * @param {*} chapterOrderList 新的章节顺序列表
     */
    static async UpdateChapterOrder(chapterOrderList) {
        const myModels = new Models();
        const rsl = await Promise.all(chapterOrderList.map(chapter =>
            myModels.EbookIndex.update(
                { OrderNum: chapter.newOrder },
                { where: { id: chapter.indexId } }
            )
        ));
        return rsl;
    }

    /**
     * 给书添加一章
     * @param {*} chapter 
     * @returns 
     */
    static async AddChapter(chapter) {
        if (chapter.BookId * 1 !== chapter.BookId) return;
        const myModels = new Models();
        let maxOrderNum = await myModels.EbookIndex.max('OrderNum', { where: { BookId: chapter.BookId } });//获取最大的OrderNum 最大值
        chapter.OrderNum = maxOrderNum + 1 || 1;//起始章节序号为1
        let rsl = await myModels.EbookIndex.create(chapter);
        return rsl;
    }

    /**
     * 全库检索
     * @param {string} keyword 搜索关键字
     * @param {object|undefined} option 高级搜索选项
     * @returns 
     */
    static async Search(keyword, option) {
        let where = {};
        if (!option) {      //默认搜索
            where = {
                [Models.Op.or]: [
                    { Title: { [Models.Op.like]: `%${keyword}%` } },
                    { Content: { [Models.Op.like]: `%${keyword}%` } },
                ],
            };
        } else {
            let typeParam = {};
            if (option.type == "title") {
                typeParam = {
                    Title: {
                        [Models.Op.like]: `%${keyword}%`,
                    },
                };
            } else if (option.type == "content") {
                typeParam = {
                    Content: {
                        [Models.Op.like]: `%${keyword}%`,
                    },
                };
            } else {
                typeParam = {
                    [Models.Op.or]: [
                        { Title: { [Models.Op.like]: `%${keyword}%` } },
                        { Content: { [Models.Op.like]: `%${keyword}%` } },
                    ],
                };
            }

            let idParam = [];
            if (option.bookId && option.bookId.length > 0) {
                idParam.push({
                    BookId: {
                        [Models.Op.in]: option.bookId,
                    },
                });
            }
            if (option.notFind && option.notFind.length > 0) {
                idParam.push({
                    BookId: {
                        [Models.Op.notIn]: option.notFind,
                    },
                });
            }

            where = {
                [Models.Op.and]: [typeParam, idParam],
            };
        }

        const myModels = Models.GetPO();
        let result = await myModels.EbookIndex.findAll({
            include: [{
                model: myModels.Ebook,
                as: "Ebook",
                attributes: ["BookName"]
            }],
            where: where,
            attributes: ["id", "Title", "BookId", "Content"],
        });

        //统计命中次数
        const escapedWord = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedWord, "gi");
        let newResult = result.map(item => {
            const matchesTitle = item.Title?.match(regex);
            const matchesContent = item.Content?.match(regex);

            const { Ebook, ...rest } = item.dataValues;
            return {
                ...rest,
                HitCount: (matchesTitle?.length ?? 0) + (matchesContent?.length ?? 0),
                BookName: Ebook.BookName
            };
        });

        //按命中次数倒序排序
        newResult.sort((a, b) => b.HitCount - a.HitCount);

        return newResult;
    }
}


module.exports = OTO_Ebook;