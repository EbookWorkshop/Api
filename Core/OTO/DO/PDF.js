import DO from "./index.js";


export default class OTO_PDF {

    /**
     * 创建一个PDF对象
     * @param {int} bookId 书的ID
     */
    static async GetPDFById(bookId) {
        return await DO.GetEBookById(bookId);
    }

}
