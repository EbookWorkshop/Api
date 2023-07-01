/**
 * 章节
 */
class Chapter {
    constructor({ Title, Content, IndexId, id }) {
        this.Title = Title?.trim();
        /**
         * 当前章节文章内容
         */
        this.Content = Content;

        this.IndexId = IndexId || id;
    }
}

module.exports = Chapter;