const { where } = require("sequelize");
const Models = require("./../Models");
// const DO = require("./index");
// const PDFBook = require("./../../../Entity/PDFBook/PDFBook");


class OTO_TAG {

    /**
     * 根据书的ID获取所有标签
     * @param {int} bookId 书的ID
     */
    static async GetTagById(bookId) {
        const myModels = Models.GetPO();
        let tags = await myModels.EbookTag.findAll({
            include: myModels.Tag,
            where: {
                bookId: bookId
            }
        });

        return tags.map(({ TagId: id, Tag }) => ({ id, Text: Tag.Text, Color: Tag.Color }));
    }

    static async AddTagForBook(bookId, tagText) {
        const myModels = Models.GetPO();
        //看看是否已有的Tag
        let [tag] = await myModels.Tag.findOrCreate({
            where: {
                Text: tagText
            }
        });

        let [_, result] = await myModels.EbookTag.findOrCreate({
            where: {
                BookId: bookId, TagId: tag.id
            }
        });

        return [tag, result];
    }

    /**
     * 删除某书的标签
     * @param {Number} bookId 
     * @param {Number} tagId 
     */
    static async RemoveTagOnBook(bookId, tagId) {
        const myModels = Models.GetPO();
        let result = await myModels.EbookTag.findAll({
            where: {
                BookId: bookId,
                TagId: tagId
            }
        });
        result.forEach(element => {
            element.destroy();
        });

        return true;
    }

    /**
     * 删除某标签
     * @param {Number} tagId 
     */
    static async DeleteTag(tagId) {
        const myModels = Models.GetPO();
        await myModels.EbookTag.destroy({
            where: {
                TagId: tagId
            }
        });
        let result = await myModels.Tag.destroy({
            where: {
                id: tagId
            }
        });
        
        return true;
    }

    /**
     * 找到所有的标签
     * @param {*} isHasBook 是否需要包含书
     * @returns 
     */
    static async GetTagList(isHasBook) {
        const myModels = Models.GetPO();
        let hasBook = isHasBook ? {
            model: myModels.EbookTag,
            required: true,
            where: { BookId: { [Models.Op.ne]: null } }
        } : {
            model: myModels.EbookTag,
            required: false
        };
        const data = await myModels.Tag.findAll({ include: [hasBook] });

        let result = data.map((t) => {
            let tag = {
                id: t.id,
                Text: t.Text,
                Color: t.Color,
                Count: t.EBookTags.length
            };
            return tag;
        })
        return result;
    }
}


module.exports = OTO_TAG;