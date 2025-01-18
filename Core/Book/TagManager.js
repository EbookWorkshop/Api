const Models = require("../OTO/Models");

/**
 * 标签管理
 */
class TagManager {
    /**
     * 给书添加标签
     * @param {*} bookId 书Id
     * @param {*} tagText 标签文本
     */
    static async AddTagOnBook(bookId, tagText) {
        tagText = tagText?.trim();
        if (!tagText) return;

        //找到标签
        let mModel = Models.GetPO();


    }
}