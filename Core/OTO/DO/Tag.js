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

    static async CreateTag(tagText, color) {
        const myModels = Models.GetPO();
        let [tag, created] = await myModels.Tag.findOrCreate({
            where: {
                Text: tagText
            },
            defaults: {
                Text: tagText,
                Color: color
            }
        });

        if (!created) {
            tag.Text = tagText;
            tag.Color = color;
            await tag.save();
        }

        return tag;
    }

    /**
     * 在某书加入标签
     * @param {*} bookId 需要加标签的书ID
     * @param {*} tagText 标签文本
     * @returns 
     */
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
        await myModels.EbookTag.destroy({
            where: {
                BookId: bookId,
                TagId: tagId
            }
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
     * 更新标签
     * @param {*} tagId 标签ID
     * @param {*} tagText 标签文本
     * @param {*} color 标签颜色
     * @returns {number} 更新数量
     */
    static async UpdateTag(tagId, tagText, color) {
        const myModels = Models.GetPO();
        let [count] = await myModels.Tag.update({
            Text: tagText,
            Color: color
        }, {
            where: {
                id: tagId
            }
        });
        return count;
    }

    /**
     * 找到所有的标签
     * @param {*} isHasBook 这个书签是否需要有书引用
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
        });
        result.sort((a, b) => b.Count - a.Count);
        return result;
    }
}


module.exports = OTO_TAG;