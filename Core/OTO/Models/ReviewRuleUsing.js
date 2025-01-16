const Sequelize = require("sequelize");

/**
 * 书本引用替换规则的情况
 * @param {*} sqlConnect 
 * @returns 
 */
module.exports = function (sqlConnect) {
    return sqlConnect.define("ReviewRuleUsing", {
    });
}