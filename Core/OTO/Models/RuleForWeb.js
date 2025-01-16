const Sequelize = require("sequelize");

/**
 * 网站规则部分
 * @param {*} sqlConnect 
 * @returns 
 */
module.exports = function (sqlConnect) {
    return sqlConnect.define("RuleForWeb", {   //每一章的地址
        Host: { type: Sequelize.STRING(100), allowNull: false },
        RuleName: { type: Sequelize.STRING(20), allowNull: false },
        Selector: { type: Sequelize.STRING(100), allowNull: false },
        RemoveSelector: { type: Sequelize.STRING(200), allowNull: true },
        GetContentAction: { type: Sequelize.STRING(100), allowNull: true },
        GetUrlAction: { type: Sequelize.STRING(100), allowNull: true },
        Type: { type: Sequelize.STRING(100), allowNull: false, defaultValue: "Object" },
        CheckSetting: { type: Sequelize.STRING(100), allowNull: true },         //用于进一步校验的配置
    });

}