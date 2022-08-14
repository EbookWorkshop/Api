const Sequelize = require("sequelize");
const Ebook = require("../../Entity/Ebook/Ebook.js");
const Index = require("../../Entity/Ebook/Index.js");
const WebBook = require("../../Entity/WebBook/WebBook.js");
const Models = require("./Models.js");

let myDb = null;
let myModels = null;//new Models(myDb);

/**
 * 数据库
 */
class DB {
    constructor() {
        if (myDb == null) {
            myDb = DB.Connect();
            myModels = new Models(myDb);
        }

    }
    GetDB() {
        return myDb;
    }

    /**
     * 建⽴连接
     * @returns 
     */
    static Connect(path) {
        path = path || "./Data/library/save.db";  //TODO：数据库存储路径 -- 配置化
        return new Sequelize({
            dialect: 'sqlite',
            storage: path,
            logging: false,
            //timezone: '+08:00',
        });
    }


    /**
     * Ebook存入数据库
     * @param {*} ebook 
     */
    async SaveEbook(ebook) {
        let ret = await myModels.Ebook.create(ebook);
        let bookId = ret.id;

        //存章节
        for (let i of ebook.Index) {
            ret = await myModels.EbookIndex.create({ BookId: bookId, Title: i.Title });
        }
        return bookId;
    }

    async SaveWebBook(wbook) {
        let bookid = await this.SaveEbook(wbook);
        wbook.BookId = bookid;
        let ret = await myModels.WebBook.create(wbook);
        return ret.id;
    }


    /**
     * 根据ID拿到书
     * @param {int} id 
     */
    async GetEbook(id) {
        let ret = await myModels.Ebook.findAll({ where: { id: id } });

        if (ret.length == 0) return null;
        // console.log("findAll", JSON.stringify(ret, "", 2));

        let book = new Ebook(ret[0]);
        //book.Index

        ret = await myModels.EbookIndex.findAll({ where: { BookId: id } });
        for (let i of ret) {
            book.Index.push(new Index(i));
        }

        return book;
    }

    async GetWebBook(id) {
        let ret = await myModels.WebBook.findAll({ where: { BookId: id } })
        if (ret.length == 0) return null;
        let b = ret[0];
        ret = await myModels.Ebook.findAll({ where: { id: id } });
        if (ret.length == 0) return null;

        let newBook = new WebBook({ ...ret[0].dataValues, ...b.dataValues });

        //TODO:Index

        //TODO:IndexUrl


        return newBook;
    }


    /**
     * 插入或更新
     * @param {*} ebook 
     */
    async SyncEbook(ebook) {
        let ret = await myModels.Ebook.update(ebook, { where: { id: ebook.BookId } });
        if (ret[0] == 0) {
            ret = await this.SaveEbook(ebook);
        }
    }
    async SyncWebBook(wbook) {
        let ret = await myModels.WebBook.update(wbook, { where: { BookId: wbook.BookId } });
        if (ret[0] == 0) {
            ret = await this.SaveWebBook(wbook);
        } else {
            await this.SyncEbook(wbook);
        }

    }
}



module.exports = DB;