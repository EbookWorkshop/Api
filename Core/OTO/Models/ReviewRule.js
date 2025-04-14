const { DataTypes } = require("sequelize");


/**
 * 每个独立的替换规则
 * @type {ReviewRule}
 * @param {*} sqlConnect 
 * @returns 
 */
module.exports = function (sqlConnect) {
    return sqlConnect.define("ReviewRule", {
        Name: { type: DataTypes.STRING(20), allowNull: false },      //配置名称
        Rule: { type: DataTypes.STRING(100), allowNull: true },      //查找规则、查找串
        Replace: { type: DataTypes.STRING(20), allowNull: true },      //真实的值类型
    });

}