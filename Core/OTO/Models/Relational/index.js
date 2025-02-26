
/**
 * 设置模型之间的关系
 * 临时的做法 以后看要怎么优化
 * @param {*} models 
 */
module.exports = function (models) {

    // Ebook <-- --> EbookIndex
    models.Ebook.hasMany(models.EbookIndex, { foreignKey: 'BookId', sourceKey: 'id', as: "EbookIndex", onDelete: 'CASCADE' });
    models.EbookIndex.belongsTo(models.Ebook, { foreignKey: 'BookId', targetKey: 'id', as: "Ebook" });

    // Ebook <-- --> WebBook
    models.Ebook.hasOne(models.WebBook, { foreignKey: 'BookId', sourceKey: 'id', onDelete: 'CASCADE' });
    models.WebBook.belongsTo(models.Ebook, { foreignKey: 'BookId', targetKey: 'id' });

    // WebBook <-- --> WebBookIndexSourceURL
    models.WebBook.hasMany(models.WebBookIndexSourceURL, { onDelete: 'CASCADE' });
    models.WebBookIndexSourceURL.belongsTo(models.WebBook);

    // EbookIndex <-- --> WebBookIndex
    models.EbookIndex.hasOne(models.WebBookIndex, { foreignKey: 'IndexId', sourceKey: 'id', as: "WebBookIndex", onDelete: 'CASCADE' });
    models.WebBookIndex.belongsTo(models.EbookIndex, { foreignKey: 'IndexId', targetKey: 'id', as: "EbookIndex" });


    // WebBookIndex <-- --> WebBookIndexURL
    models.WebBookIndex.hasMany(models.WebBookIndexURL, { foreignKey: "WebBookIndexId", sourceKey: "id", onDelete: 'CASCADE' });
    models.WebBookIndexURL.belongsTo(models.WebBookIndex, { foreignKey: 'WebBookIndexId', targetKey: "id" });

    // Ebook <-- --> PDFBook
    models.Ebook.hasOne(models.PDFBook, { foreignKey: 'BookId', sourceKey: 'id', onDelete: 'CASCADE' });
    models.PDFBook.belongsTo(models.Ebook, { foreignKey: 'BookId', targetKey: 'id' });

    // ReviewRule <-- --> ReviewRuleUsing <-- --> Ebook
    models.ReviewRule.hasMany(models.ReviewRuleUsing, { foreignKey: 'RuleId', sourceKey: 'id', onDelete: 'CASCADE' });
    models.ReviewRuleUsing.belongsTo(models.ReviewRule, { foreignKey: 'RuleId', targetKey: 'id' });
    models.ReviewRuleUsing.belongsTo(models.Ebook, { foreignKey: 'BookId', targetKey: 'id' });
    models.Ebook.hasMany(models.ReviewRuleUsing, { foreignKey: 'BookId', sourceKey: 'id', onDelete: 'CASCADE' });


    // Ebook <-- --> EBookTag <-- --> Tag
    models.Ebook.hasMany(models.EbookTag, { foreignKey: 'BookId', sourceKey: 'id', onDelete: 'CASCADE' });
    models.EbookTag.belongsTo(models.Ebook, { foreignKey: 'BookId', targetKey: 'id' });
    models.EbookTag.belongsTo(models.Tag, { foreignKey: 'TagId', targetKey: 'id' });
    models.Tag.hasMany(models.EbookTag, { foreignKey: 'TagId', sourceKey: 'id', onDelete: 'CASCADE' });

    // EbookIndex <-- --> Bookmark
    models.EbookIndex.hasOne(models.Bookmark, { foreignKey: { name: 'IndexId', unique: true }, sourceKey: 'id', as: "EbookIndex", onDelete: 'CASCADE' });
    models.Bookmark.belongsTo(models.EbookIndex, { foreignKey: "IndexId" });
}