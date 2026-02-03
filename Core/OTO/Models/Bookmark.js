/**
 * 书本引用替换规则的情况
 * @param {*} sqlConnect 
 * @returns 
 */
module.exports = function (sqlConnect) {
    return sqlConnect.define("Bookmark", {
        //TODO: 显式定义外键后数据库创建不了
        // IndexId: { type: DataTypes.INTEGER, allowNull: false },
    });
}