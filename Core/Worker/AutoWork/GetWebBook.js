const Models = require("../../OTO/Models");
const WebBookMaker = require("../../WebBook/WebBookMaker")


/**
 * 后台拉网文空章节
 */
async function Main() {
    let { BookId, id, Title, BookName } = await GetNextWorkInfo();
    const webBook = new WebBookMaker(BookId);
    await webBook.loadFromDB;
    await webBook.UpdateOneChapter(id, false, undefined, '');

    console.log("已更新章节:", { BookId, id, Title, BookName });
}

/**
 * 获取下一个将执行的章节
 * @returns 
 */
async function GetNextWorkInfo() {
    const myModels = await new Models();
    const chapter = await myModels.EbookIndex.findOne({
        include: [{
            model: myModels.Ebook,
            as: "Ebook",
            include: [{
                model: myModels.WebBook,
                as: "WebBook"
            }]
        }],
        where: {
            Content: { [Models.Op.is]: null },
        },
        attributes: ["id", "BookId", "Title"],
        order: [["updatedAt", "DESC"]]
    });

    if (!chapter) {
        await myModels.EbookIndex.update({
            Content: null
        }, {
            where: {
                Content: { [Models.Op.eq]: '' },
            },
        })
        return null;
    }
    let { BookId, id, Title, Ebook: { BookName } } = chapter.dataValues;
    return { BookId, id, Title, BookName }
}

/**
 * 执行入口
 * @param {object} param 参数
 * @returns {Promise<bool>}
 */
async function Run(param) {
    try {
        return await Main();
    } catch (error) {
        console.error(`[${new Date().toLocaleString()}]\t自动抓取网文出错：`, error)
    }
}

module.exports = {
    Run,
    GetNextWorkInfo,
}