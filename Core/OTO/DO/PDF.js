const DO = require("./index");
// const Models = require("./../Models");
// const PDFBook = require("./../../../Entity/PDFBook/PDFBook");


class OTO_PDF {

    /**
     * 创建一个PDF对象
     * @param {int} bookId 书的ID
     */
    static async GetPDFById(bookId) {
        return await DO.GetEBookById(bookId);
    }

}


module.exports = OTO_PDF;