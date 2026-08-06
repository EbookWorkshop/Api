import { DataTypes } from "sequelize";

/**
 * Ebook 表
 */
export default function (sqlConnect) {
    return sqlConnect.define("Ebook", {
        BookName: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        Author: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        CoverImg: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        Hotness: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        TotalWord: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
    });
}