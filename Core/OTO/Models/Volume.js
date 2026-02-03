const { DataTypes } = require("sequelize");

/**
 * 卷表  
 * 对象：Volume     
 * 表：Volume  
 * @param {*} sqlConnect 
 * @returns 
 */
module.exports = function (sqlConnect) {
    return sqlConnect.define("Volume", {
        //卷标题
        Title: { type: DataTypes.STRING(50), allowNull: false },
        //卷简介
        Introduction: { type: DataTypes.TEXT, allowNull: true },
        /**
         * 排序号
         */
        OrderNum: { type: DataTypes.INTEGER, allowNull: false },
        BookId: { type: DataTypes.INTEGER, allowNull: false },
    });
};
