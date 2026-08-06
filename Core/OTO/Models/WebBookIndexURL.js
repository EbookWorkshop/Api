import { DataTypes } from "sequelize";

/**
 * 网文每一章对应的网络来源地址
 * @param {*} sqlConnect 
 * @returns 
 */
export default function (sqlConnect) {
    return sqlConnect.define("WebBookIndexURL", {   //每一章的地址
        Path: { type: DataTypes.STRING(500), allowNull: false },
        WebBookIndexId: { type: DataTypes.INTEGER, allowNull: false },
    }, {
        indexes: [
            {
                // 单列索引，对应 SQL: CREATE INDEX ON WebBookIndexURLs(WebBookIndexId)
                fields: ['WebBookIndexId'],
                name: 'idx_WebBookIndexURLs_WebBookIndexId',
            },
        ],
    });
}