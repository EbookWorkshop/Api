const Sequelize = require("sequelize");


/**
 * 每个独立的替换规则
 * @param {*} sqlConnect 
 * @returns 
 */
module.exports = function (sqlConnect) {
    return sqlConnect.define("ReviewRule", {
        Name: { type: Sequelize.STRING(20), allowNull: false },      //配置名称
        Rule: { type: Sequelize.STRING(100), allowNull: true },      //查找规则、查找串
        Replace: { type: Sequelize.STRING(20), allowNull: true },      //真实的值类型
    });

}