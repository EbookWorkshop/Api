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

        return tags.map(({ id, Tag }) => ({ id, Text: Tag.Text, Color: Tag.Color }));
    }

}


module.exports = OTO_TAG;