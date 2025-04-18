//校阅-书本
const Ebook = require("../../Entity/Ebook/Ebook");
const Index = require("../../Entity/Ebook/Index");
const Chapter = require("../../Entity/Ebook/Chapter");
const ReviewRule = require("../../Entity/ReviewRule");
// const Do2Po = require("../OTO/DO");
const Models = require("../OTO/Models");
const { Test: ExecReview } = require("./../../Core/Utils/ReviewString");

class ReviewBook {
    constructor() { }

    /**
     * 测试校阅全本的情况
     * @param {any} setting 设置
     */
    static async Try(setting) {
        if (setting.chapterids?.length == 0 || !setting.regex) return null;

        const myModels = Models.GetPO();
        let chapters = await myModels.EbookIndex.findAll({
            where: {
                id: setting.chapterids
            }
        });

        const testRule = new ReviewRule({ Name: "测试", Rule: setting.regex, Replace: setting.replace });

        let result = [];
        for (let chp of chapters) {
            const cpRsl = ExecReview(testRule, chp.Content);
            if (chapters.length > 5 && !cpRsl.match) continue; //如果要预览的章节太多了，就不显示没有匹配到的章节
            result.push({
                title: chp.Title,
                content: chp.Content,
                newText: cpRsl.result,
            })
        }

        return result;
    }

    /**
     * 向全书应用校阅
     * @param {*} setting 
     * @returns 
     */
    static async Save(setting) {
        if (!setting.bookid || !setting.regex) return null;
        const myModels = Models.GetPO();
        let chapters = await myModels.EbookIndex.findAll({
            where: {
                BookId: setting.bookid
            }
        });
        const testRule = new ReviewRule({ Name: "测试", Rule: setting.regex, Replace: setting.replace });

        let result = [];
        for (let chp of chapters) {
            const cpRsl = ExecReview(testRule, chp.Content);
            if (!cpRsl.match || cpRsl.match.length == 0) continue; //如果没有匹配到，就不保存
            const rsl = await myModels.EbookIndex.update({ Content: cpRsl.result }, { where: { id: chp.id } });
            result.push({
                title: chp.Title,
                content: chp.Content,
                newText: cpRsl.result,
                updateRsl: rsl ? cpRsl.match.length : 0,
            });
        }

        return result;
    }
}

module.exports = ReviewBook;
