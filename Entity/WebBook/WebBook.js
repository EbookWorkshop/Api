let Ebook = require("../Ebook/Ebook");

class WebBook extends Ebook {
    constructor() {
        super();

        this.IndexUrl = [];     //可供爬书的目录页-数组，用于支持多网站来源
    }
}

module.exports = WebBook;