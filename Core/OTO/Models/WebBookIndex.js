const { DataTypes } = require("sequelize");

/**
 * 网文目录
 * @param {*} sqlConnect 
 * @returns 
 */
module.exports = function (sqlConnect) {
    return sqlConnect.define("WebBookChapter", {
        WebTitle: { type: DataTypes.STRING(50), allowNull: false }                  //网文章节标题-网文合并的唯一标识
    });
}