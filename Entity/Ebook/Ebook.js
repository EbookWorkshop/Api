


/**
 * 电子书
 */
class Ebook {
    constructor({ id, BookId, BookName, Author, FontFamily, FontSize, CoverImg }) {
        /**
         * 章节 Map<{string,string}>   
         *  (Key:章节标题,Value:章节文章-不分页（有分页的话得先合并）)
         */
        this.Chapters = new Map();
        /**
         * @prop {Index} 目录
         */
        this.Index = [];
        /**
         * 书Id
         */
        this.BookId = BookId || id;
        /**
         * 书名-用于显示的名称
         */
        this.BookName = BookName?.trim();
        //作者
        this.Author = Author?.trim();

        //字体
        this.FontFamily = FontFamily || "微软雅黑";

        //字号
        this.FontSize = FontSize || 22;   //pt
        //封面图片
        this.CoverImg = CoverImg;

        //校阅规则
        this.ReviewRules = null;
    }
}


module.exports = Ebook;