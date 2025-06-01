const { DataTypes } = require("sequelize");

/**
 * Ebook 表
 */
module.exports = function (sqlConnect) {
    return sqlConnect.define("Ebook", {
        BookName: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        Author: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        FontFamily: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: "微软雅黑"
        },
        FontSize: {
            type: DataTypes.INTEGER,
            defaultValue: 22
        },
        CoverImg: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        Hotness: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    });
}