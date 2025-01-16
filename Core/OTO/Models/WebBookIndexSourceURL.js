const Sequelize = require("sequelize");

/**
 * WebBook 目录页 网页地址
 * @param {*} sqlConnect 
 * @returns 
 */
module.exports = function (sqlConnect) {
    return sqlConnect.define("WebBookIndexSourceURL", {   //书目录页URL
        Path: { type: Sequelize.STRING(500), allowNull: true }
    });
}