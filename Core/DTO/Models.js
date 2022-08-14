const Sequelize = require("sequelize");
const EventManager = require("./../EventManager.js");




class Models {
    constructor(sequelize) {
        /**
         * EBook表对象
         */
        this.Ebook;

        /**
         * 电子书的目录
         */
        this.EbookIndex;

        this.WebBook;
        this.WebBookIndex;
        this.WebBookIndexURL;




        this.InitModels(sequelize); //注意，表当前没同步好
    }

    async InitModels(sequelize) {
        /**
         * Ebook 部分表
         */
        this.Ebook = sequelize.define("Ebook", {
            BookName: { type: Sequelize.STRING(50), allowNull: false },
            Author: { type: Sequelize.STRING(20), allowNull: true },
            FontFamily: { type: Sequelize.STRING(10), allowNull: false },
            FontSize: { type: Sequelize.INTEGER, defaultValue: 22 },
            CaverImg: { type: Sequelize.STRING(50), allowNull: true },
        });
        let ret = await this.Ebook.sync();

        this.EbookIndex = sequelize.define("EbookIndex", {
            BookId: { type: Sequelize.INTEGER, defaultValue: 0 },
            Title: { type: Sequelize.STRING(50), allowNull: false }
        });
        ret = await this.EbookIndex.sync();


        /**
         * WebBook 部分
         */
        this.WebBook = sequelize.define("WebBook", {
            BookId: { type: Sequelize.INTEGER, defaultValue: 0 },
            defaultIndex: { type: Sequelize.INTEGER, defaultValue: 0 },
            WebBookName: { type: Sequelize.STRING(50), allowNull: false },
            isCheckEnd: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            isCheckRepeat: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        });
        ret = await this.WebBook.sync();
        this.WebBookIndex = sequelize.define("WebBookIndex", {
            IndexId: { type: Sequelize.INTEGER, defaultValue: 0 },
            WebTitle: { type: Sequelize.STRING(50), allowNull: false }
        });
        ret = await this.WebBookIndex.sync();
        this.WebBookIndexURL = sequelize.define("WebBookIndexURL", {
            WBIndexId: { type: Sequelize.INTEGER, defaultValue: 0 },
            Path: { type: Sequelize.STRING(500), allowNull: true }
        });
        ret = await this.WebBookIndexURL.sync();




        new EventManager().emit("DB.Models.Init");
    }


}

module.exports = Models;