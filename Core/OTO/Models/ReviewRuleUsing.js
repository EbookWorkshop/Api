/**
 * 书本引用替换规则的情况
 * @param {*} sqlConnect 
 * @returns 
 */
module.exports = function (sqlConnect) {
    return sqlConnect.define("ReviewRuleUsing", {
        //TODO: 显式定义外键后数据库创建不了
        // RuleId: { type: DataTypes.INTEGER, allowNull: false },
        // BookId: { type: DataTypes.INTEGER, allowNull: false },
    });
}