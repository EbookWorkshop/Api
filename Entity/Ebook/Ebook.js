/**
 * 电子书
 */
class Ebook {
    constructor() {
        //章节
        this.Chapters = [];
        //目录
        this.Index = [];
        /**
         * 书Id
         */
        this.BookId = "";
        //书名
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