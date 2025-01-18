const Sequelize = require("sequelize");

/**
 * 标签
 * @param {*} sqlConnect 
 * @returns 
 */
module.exports = function (sqlConnect) {
    return sqlConnect.define("Tag", {
        Text: { type: Sequelize.STRING(20), allowNull: false },
        Color: { type: Sequelize.STRING(10), allowNull: true },
    });
}