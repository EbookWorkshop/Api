/**
 * 电子书
 */
class Ebook {
    constructor() {
        /**
         * 章节 Map (Key:章节标题,Value:章节文章-不分页（有分页的话得先合并）)
         */
        this.Chapters = new Map();
        /**
         * 目录
         */
        this.Index = [];
        /**
         * 书Id
         */
        this.BookId = "";
        /**
         * 书名-用于显示的名称
         */
        this.BookName = "";
        //作者
        this.Author = "";

        //字体
        this.FontFamily = "微软雅黑";

        //字号
        this.FontSize = "22";   //pt
        //封面图片
        this.CaverImg = null;
    }
}


module.exports = Ebook;