const { DataTypes } = require("sequelize");

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
        Title: { type: DataTypes.STRING(50), allowNull: false },
        //章节正文
        Content: { type: DataTypes.TEXT, allowNull: true },
        /**
         * 排序号
         */
        OrderNum: { type: DataTypes.INTEGER, allowNull: false },
        HasContent: {
            type: DataTypes.VIRTUAL,        //虚拟字段
            get() {
                return this.getDataValue("Content")?.length > 0;
            }
        }
    });
}