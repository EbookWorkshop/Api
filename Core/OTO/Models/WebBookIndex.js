const { DataTypes } = require("sequelize");

/**
 * 网文目录
 * @param {*} sqlConnect 
 * @returns 
 */
module.exports = function (sqlConnect) {
    return sqlConnect.define("WebBookChapter", {
        //网文章节标题-网文合并的唯一标识
        WebTitle: { type: DataTypes.STRING(50), allowNull: false },
        //是否隐藏的章节
        isHidden: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
    });
}