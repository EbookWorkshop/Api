const { DataTypes } = require("sequelize");


module.exports = function (sqlConnect) {
    return sqlConnect.define("PDFBook", {
        PaddingX: { type: DataTypes.INTEGER, allowNull: false },
        PaddingY: { type: DataTypes.INTEGER, allowNull: false },
        PageWidth: { type: DataTypes.INTEGER, allowNull: false },
        IsShowTitleOnChapter: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        BookId: { type: DataTypes.INTEGER, allowNull: false },
    });
}