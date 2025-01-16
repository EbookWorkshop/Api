const Sequelize = require("sequelize");

/**
 * Ebook 表
 */
module.exports = function (sqlConnect) {
    return sqlConnect.define("Ebook", {
        BookName: {
            type: Sequelize.STRING(50),
            allowNull: false
        },
        Author: {
            type: Sequelize.STRING(20),
            allowNull: true
        },
        FontFamily: {
            type: Sequelize.STRING(10),
            allowNull: false,
            defaultValue: "微软雅黑"
        },
        FontSize: {
            type: Sequelize.INTEGER,
            defaultValue: 22
        },
        CoverImg: {
            type: Sequelize.STRING(50),
            allowNull: true
        },
    });
}