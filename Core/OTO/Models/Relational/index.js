
/**
 * 设置模型之间的关系
 * 临时的做法 以后看要怎么优化
 * @param {*} models 
 */
module.exports = function (models) {

    // Ebook <-- --> EbookIndex
    models.Ebook.hasMany(models.EbookIndex, { foreignKey: 'BookId', sourceKey: 'id', as: "EbookIndex" });
    models.EbookIndex.belongsTo(models.Ebook, { foreignKey: 'BookId', targetKey: 'id', as: "Ebook" });

    // Ebook <-- --> WebBook
    models.Ebook.hasOne(models.WebBook, { foreignKey: 'BookId', sourceKey: 'id' });
    models.WebBook.belongsTo(models.Ebook, { foreignKey: 'BookId', targetKey: 'id' });

    // WebBook <-- --> WebBookIndexSourceURL
    models.WebBook.hasMany(models.WebBookIndexSourceURL);
    models.WebBookIndexSourceURL.belongsTo(models.WebBook);
    
    // EbookIndex <-- --> WebBookIndex
    models.EbookIndex.hasOne(models.WebBookIndex, { foreignKey: 'IndexId', sourceKey: 'id', as: "WebBookIndex" });
    models.WebBookIndex.belongsTo(models.EbookIndex, { foreignKey: 'IndexId', targetKey: 'id', as: "EbookIndex" });
    
    
    // WebBookIndex <-- --> WebBookIndexURL
    models.WebBookIndex.hasMany(models.WebBookIndexURL, { foreignKey: "WebBookIndexId", sourceKey: "id" });
    models.WebBookIndexURL.belongsTo(models.WebBookIndex, { foreignKey: 'WebBookIndexId', targetKey: "id" });
    
    // Ebook <-- --> PDFBook
    models.Ebook.hasOne(models.PDFBook, { foreignKey: 'BookId', sourceKey: 'id' });
    models.PDFBook.belongsTo(models.Ebook, { foreignKey: 'BookId', targetKey: 'id' });

    // ReviewRule <-- --> ReviewRuleUsing
    models.ReviewRule.hasMany(models.ReviewRuleUsing, { foreignKey: 'RuleId', sourceKey: 'id' });
    models.ReviewRuleUsing.belongsTo(models.ReviewRule, { foreignKey: 'RuleId', targetKey: 'id' });
    
    // Ebook <-- --> ReviewRuleUsing
    models.Ebook.hasMany(models.ReviewRuleUsing, { foreignKey: 'BookId', sourceKey: 'id' });
    models.ReviewRuleUsing.belongsTo(models.Ebook, { foreignKey: 'BookId', targetKey: 'id' });
}