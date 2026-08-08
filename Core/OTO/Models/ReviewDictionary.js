import { DataTypes } from "sequelize";

/**
 * 记录具体网站应用的替换字典
 * 每个网站在抓取数据后，根据字典的内容自动解码并存储。主要应对利用私有字符反扒网站进行数据还原
 * @param {*} sqlConnect 
 * @returns 
 */
export default function (sqlConnect) {
    return sqlConnect.define("ReviewDictionary", {
        Host: { type: DataTypes.STRING(100), allowNull: false },            //应用的站点
        ExecuteType: { type: DataTypes.STRING(50), allowNull: true },        //分类执行条件
        Execute: { type: DataTypes.STRING(50), allowNull: true },           //应用条件：即达到条件，这份对照字典才启用
        Data: { type: DataTypes.STRING(1000), allowNull: false },           //实际存储字典数据
    }, {
        indexes: [
            {
                name: 'review_dictionary_host_index',
                fields: ['Host']
            }
        ]
    });
}