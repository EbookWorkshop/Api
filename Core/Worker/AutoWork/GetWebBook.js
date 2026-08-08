import Models from "../../OTO/Models/index.js";
import WebBookMaker from "../../WebBook/WebBookMaker.js";


/**
 * 后台拉网文空章节
 */
async function Main() {
    let { BookId, id, Title, BookName } = await GetNextWorkInfo();
    if (!BookId || !id) return;
    const webBook = new WebBookMaker(BookId);
    await webBook.loadFromDB;
    await webBook.UpdateOneChapter(id, false, undefined, '');

    console.log("已更新章节:", { BookId, id, Title, BookName });
}

/**
 * 获取下一个将执行的章节
 * @returns 
 */
export async function GetNextWorkInfo() {
    const myModels = await new Models();
    const chapter = await myModels.EbookIndex.findOne({
        include: [{
            model: myModels.Ebook,
            as: "Ebook",
            required: true,            // INNER JOIN
            include: [{
                model: myModels.WebBook,
                as: "WebBook",
                required: true,         // INNER JOIN
                where: { AutoSyncEnabled: { [Models.Op.eq]: true } },
                attributes: []
            }],
            attributes: ['BookName']   // 只取 Ebooks 的 BookName
        }],
        where: {
            Content: { [Models.Op.is]: null },
            OrderNum: { [Models.Op.gt]: 0 }
        },
        attributes: ['id', 'BookId', 'Title'],
        order: [[myModels.sequelize.col('EbookChapter.updatedAt'), 'DESC']],         // 按主表 updatedAt 排序
        subQuery: false,               // 强制单查询，避免拆分
        raw: true,
    });

    if (!chapter) {
        let [rows] = await myModels.EbookIndex.update({
            Content: null
        }, {
            where: {
                Content: { [Models.Op.eq]: '' },
            },
        });
        console.log("所有待办任务已处理，将重置列表并重新开始。已重置任务数：", rows);
        return { id: null };
    }
    let { BookId, id, Title, ["Ebook.BookName"]: BookName } = chapter;
    return { BookId, id, Title, BookName }
}

/**
 * 执行入口
 * @param {object} param 参数
 * @returns {Promise<bool>}
 */
export async function Run(param) {
    try {
        return await Main();
    } catch (error) {
        console.error(`[${new Date().toLocaleString()}]\t自动抓取网文出错：`, error)
    }
}

