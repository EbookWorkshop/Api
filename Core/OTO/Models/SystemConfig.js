const Sequelize = require("sequelize");

/**
 * 系统配置项表
 * @param {*} sqlConnect 
 * @returns 
 */
module.exports = function (sqlConnect) {
    return sqlConnect.define("SystemConfig", {
        Group: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "default" },     //配置分组
        Name: { type: Sequelize.STRING(20), allowNull: false },      //配置名称
        Value: { type: Sequelize.STRING(500), allowNull: false },   //配置值
        RealDataType: { type: Sequelize.STRING(10), allowNull: true },  //真实的值类型
    });
}