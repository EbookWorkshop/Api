const { DataTypes } = require("sequelize");

/**
 * 系统配置项表
 * @param {*} sqlConnect 
 * @returns 
 */
module.exports = function (sqlConnect) {
    return sqlConnect.define("SystemConfig", {
        Group: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "default" },     //配置分组
        Name: { type: DataTypes.STRING(20), allowNull: false },      //配置名称
        Value: { type: DataTypes.STRING(500), allowNull: false },   //配置值
        RealDataType: { type: DataTypes.STRING(10), allowNull: true },  //真实的值类型
    });
}