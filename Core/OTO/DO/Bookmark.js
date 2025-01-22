const Models = require("./../Models");


class OTO_BOOKMARK {

    /**
     * 创建一个BOOKMARK对象
     * @param {int} bookId 书的ID
     */
    static async GetBookmark(bookId) {
        const myModels = new Models();

        let whereParam = bookId > 0 ? { where: { BookId: bookId } } : {};
        let bookmark = await myModels.Bookmark.findAll(whereParam);

        return bookmark;
    }

    /**
     * 添加一个书签
     * @param {*} chapterId 章节标签
     * @returns 
     */
    static async AddBookmark(chapterId) {
        if (!chapterId) return null;
        const myModels = new Models();
        const rsl = await myModels.Bookmark.create({
            IndexId: chapterId
        });

        return rsl;
    }

    /**
     * 删除一个书签
     * @param {*} id 章节标签
     * @returns 
     */
    static async DelBookmark(id) {
        if (!id) return null;
        const myModels = new Models();
        const rsl = await myModels.Bookmark.destroy({
            where: {
                id: id
            }
        });

        return rsl;
    }
}


module.exports = OTO_BOOKMARK;