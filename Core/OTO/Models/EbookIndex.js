const Sequelize = require("sequelize");

/**
 * Ebook目录    
 * 对象：EbookIndex     
 * 表：EbookChapter    
 * @param {*} sqlConnect 
 * @returns 
 */
module.exports = function (sqlConnect) {
    return sqlConnect.define("EbookChapter", {
        //章节标题
        Title: { type: Sequelize.STRING(50), allowNull: false },
        //章节正文
        Content: { type: Sequelize.TEXT, allowNull: true },
        /**
         * 排序号
         */
        OrderNum: { type: Sequelize.INTEGER, allowNull: false },
        HasContent: {
            type: Sequelize.VIRTUAL,        //虚拟字段
            get() {
                return this.getDataValue("Content")?.length > 0;
            }
        }
    });
}