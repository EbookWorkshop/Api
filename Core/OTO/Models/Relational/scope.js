
/**
 * 定义作用域
 * @param {*} models 
 */
export default function (models) {
    models.EbookIndex.addScope('withHasContent', {
        attributes: {
            include: [
                [
                    models.sequelize.literal(
                        'CASE WHEN Content IS NOT NULL AND Content != "" THEN 1 ELSE 0 END'
                    ),
                    'HasContent'
                ]
            ]
        }
    });
}