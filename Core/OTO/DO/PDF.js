const DO = require("./index");
const Models = require("./../Models");
const PDFBook = require("./../../../Entity/PDFBook/PDFBook");


class OTO_PDF {

    /**
     * 创建一个PDF对象
     * @param {int} bookId 书的ID
     */
    static async GetPDFById(bookId) {
        const myModels = new Models();
        let book = await myModels.Ebook.findOne({ where: { id: bookId } });
        if (book == null) return null;

        let pdf = await DO.ModelToBookObj(book, PDFBook);

        /**
         * 设置包含的章节
         * @param {Array} chapters 需要的章节Id
         */
        pdf.SetShowChapters = async (chapters) => {
            for (let c of chapters) {
                if (pdf.showIndexId.has(c)) continue;
                await pdf.ReloadChapter(c);
                await pdf.ReviewChapter(c.IndexId);
                pdf.showIndexId.add(c);
            }
        }

        return pdf;
    }

}


module.exports = OTO_PDF;