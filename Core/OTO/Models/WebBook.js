const Sequelize = require("sequelize");

/**
 * Webbook
 * 网文配置
 * 映射到 Entity/WebBook
 * @param {*} sqlConnect 
 * @returns 
 */
module.exports = function (sqlConnect) {
    return sqlConnect.define("WebBook", {
        //默认用哪个网址——用于多来源的情景//需要改造
        defaultIndex: { type: Sequelize.INTEGER, defaultValue: 0 },
        //网文书名-网文识别合并的唯一标识   (不要改名)
        WebBookName: { type: Sequelize.STRING(50), allowNull: false },
        //是否检查文章正常结束
        isCheckEnd: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        //是否检查章节重复
        isCheckRepeat: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    });
}