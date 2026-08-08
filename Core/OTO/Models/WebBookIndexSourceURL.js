import { DataTypes } from "sequelize";

/**
 * WebBook 目录页 网页地址
 * @param {*} sqlConnect 
 * @returns 
 */
export default function (sqlConnect) {
    return sqlConnect.define("WebBookIndexSourceURL", {   //书目录页URL
        Path: { type: DataTypes.STRING(500), allowNull: true },
        WebBookId: { type: DataTypes.INTEGER, allowNull: false },
    });
}