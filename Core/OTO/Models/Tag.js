const { DataTypes } = require("sequelize");

/**
 * 标签
 * @param {*} sqlConnect 
 * @returns 
 */
module.exports = function (sqlConnect) {
    return sqlConnect.define("Tag", {
        Text: { type: DataTypes.STRING(20), allowNull: false },
        Color: { type: DataTypes.STRING(10), allowNull: true },
    });
}