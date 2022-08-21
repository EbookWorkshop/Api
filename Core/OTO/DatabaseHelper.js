const Sequelize = require("sequelize");
const Ebook = require("../../Entity/Ebook/Ebook.js");
const Index = require("../../Entity/Ebook/Index.js");
const WebBook = require("../../Entity/WebBook/WebBook.js");
const Models = require("./Models.js");
const DO = require("./DO.js");

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
    static GetDB() {
        return myDb;
    }
    static Models() {
        return myModels;
    }

    /**
     * 建⽴连接
     * @returns 
     */
    static Connect(path) {
        path = path || "./Data/library/save.sqlite";  //TODO：数据库存储路径 -- 配置化
        return new Sequelize({
            dialect: 'sqlite',
            storage: path,
            logging: false,
            //timezone: '+08:00',
        });
    }

    /**
     * 
     * @param {*} id 
     * @returns 
     */
    async GetWebBook(id) {
        let wb = await myModels.WebBook.findOne({ where: { BookId: id } });
        return await DO.ModelToWebBook(wb);
    }

    /**
     * 根据书名找到对应的电子书配置
     * @param {string} bookName 书名/网文的唯一书名
     * @returns WebBook
     */
    async GetOrCreateWebBookByName(bookName) {
        bookName = bookName?.trim();
        if (!bookName) return;
        let [book, created] = await myModels.WebBook.findOrCreate({
            where: { WebBookName: bookName }
        });

        if (created) {
            //新创建的话也创建EBook档案，并用EBook 的ID更新WebBook
            let [ebook, ecreated] = await myModels.Ebook.findOrCreate({
                where: { BookName: bookName }
            });

            if (ecreated) {
                book.update({ BookId: ebook.id }, { where: { WebBookName: bookName } });
            }
        }

        return await DO.ModelToWebBook(book);
    }

    
}



module.exports = DB;