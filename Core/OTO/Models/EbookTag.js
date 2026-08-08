
/**
 * 书有的签
 * @param {*} sqlConnect 
 * @returns 
 */
export default function (sqlConnect) {
    return sqlConnect.define("EBookTag", {
        //TODO: 显式定义外键后数据库创建不了
        // BookId: { type: DataTypes.INTEGER, allowNull: false },
    });
}