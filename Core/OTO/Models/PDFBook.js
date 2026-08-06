import { DataTypes } from "sequelize";


export default function (sqlConnect) {
    return sqlConnect.define("PDFBook", {
        FontFamily: { type: DataTypes.STRING(10), allowNull: true, },
        FontSize: { type: DataTypes.INTEGER, defaultValue: 22 },
        PaddingX: { type: DataTypes.INTEGER, allowNull: false },
        PaddingY: { type: DataTypes.INTEGER, allowNull: false },
        PageWidth: { type: DataTypes.INTEGER, allowNull: false },
        IsShowTitleOnChapter: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        BookId: { type: DataTypes.INTEGER, allowNull: false },
    });
}