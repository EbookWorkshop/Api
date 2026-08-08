import { DataTypes } from "sequelize";

/**
 * 网站规则部分
 * @param {*} sqlConnect 
 * @returns 
 */
export default function (sqlConnect) {
    return sqlConnect.define("RuleForWeb", {   //每一章的地址
        Host: { type: DataTypes.STRING(100), allowNull: false },
        RuleName: { type: DataTypes.STRING(20), allowNull: false },
        Selector: { type: DataTypes.STRING(100), allowNull: false },
        RemoveSelector: { type: DataTypes.STRING(200), allowNull: true },
        GetContentAction: { type: DataTypes.STRING(100), allowNull: true },
        GetUrlAction: { type: DataTypes.STRING(100), allowNull: true },
        Type: { type: DataTypes.STRING(100), allowNull: false, defaultValue: "Object" },
        CheckSetting: { type: DataTypes.STRING(100), allowNull: true },         //用于进一步校验的配置
    }, {
        indexes: [
            {
                name: 'rule_for_web_host_index',
                fields: ['Host']
            }
        ]
    });

}