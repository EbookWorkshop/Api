import { DataTypes } from "sequelize";

/**
 * 系统配置项表
 * @param {*} sqlConnect 
 * @returns 
 */
export default function (sqlConnect) {
    return sqlConnect.define("SystemConfig", {
        Group: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "default" },     //配置分组
        Name: { type: DataTypes.STRING(20), allowNull: false },      //配置名称
        Value: { type: DataTypes.STRING(500), allowNull: false },   //配置值
        RealDataType: { type: DataTypes.STRING(10), allowNull: true },  //真实的值类型
    }, {
        indexes: [
            {
                // 唯一联合索引，对应 SQL: CREATE UNIQUE INDEX ON SystemConfigs(`Group`, `Name`)
                unique: true,
                fields: ['Group', 'Name'],
                name: 'idx_group_name', // 可选，不指定则自动生成
            },
        ],
    });
}