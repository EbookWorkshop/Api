const Sequelize = require("sequelize");


module.exports = function (sqlConnect) {
    return sqlConnect.define("PDFBook", {
        PaddingX: { type: Sequelize.INTEGER, allowNull: false },
        PaddingY: { type: Sequelize.INTEGER, allowNull: false },
        PageWidth: { type: Sequelize.INTEGER, allowNull: false },
        IsShowTitleOnChapter: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    });
}