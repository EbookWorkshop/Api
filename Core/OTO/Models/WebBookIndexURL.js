const { DataTypes } = require("sequelize");

/**
 * 网文每一章对应的网络来源地址
 * @param {*} sqlConnect 
 * @returns 
 */
module.exports = function (sqlConnect) {
    return sqlConnect.define("WebBookIndexURL", {   //每一章的地址
        Path: { type: DataTypes.STRING(500), allowNull: false }
    });
}