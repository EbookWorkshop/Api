import { DataTypes } from "sequelize";

/**
 * 标签
 * @param {*} sqlConnect 
 * @returns 
 */
export default function (sqlConnect) {
    return sqlConnect.define("Tag", {
        Text: { type: DataTypes.STRING(20), allowNull: false },
        Color: { type: DataTypes.STRING(10), allowNull: true },
    });
}