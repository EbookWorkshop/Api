import { DataTypes } from "sequelize";

/**
 * 网文目录
 * @param {*} sqlConnect 
 * @returns 
 */
export default function (sqlConnect) {
    return sqlConnect.define("WebBookChapter", {
        //-网文合并的唯一标识
        WebTitle: { type: DataTypes.STRING(50), allowNull: false },
        IndexId: { type: DataTypes.INTEGER, allowNull: false },
    }, {
        indexes: [
            {
                // 单列索引，对应 SQL: CREATE INDEX ON WebBookChapters(IndexId)
                unique: true,
                fields: ['IndexId'],
                name: 'idx_webbookchapters_IndexId',
            },
        ],
    });
}