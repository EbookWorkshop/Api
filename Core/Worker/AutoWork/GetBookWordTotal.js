import Models from "../../OTO/Models/index.js";
import { AnalyzeBookText } from "../../Book/Analyze.js";

/**
 * 后台拉网文空章节
 */
async function Main() {
    let { id, BookName } = await GetNextBook();
    if (id < 0) return;
    AnalyzeBookText(id);
    console.warn("已统计字数：", BookName)
}

/**
 * 获取下一个将执行的章节
 * @returns 
 */
export async function GetNextBook() {
    const myModels = await new Models();

    const lastBook = await myModels.Ebook.findOne({
        attributes: ["id", "updatedAt"],
        order: [["updatedAt", "DESC"]]
    });
    const { updatedAt } = lastBook?.dataValues;
    if (!updatedAt) return { id: -1 };
    let diffDay = ((new Date()) - updatedAt) / (1000 * 60 * 60 * 24);
    if (diffDay < 1) return { id: -1 };//最短每隔1天运行一次

    const book = await myModels.Ebook.findOne({
        where: {
            TotalWord: { [Models.Op.eq]: 0 },
        },
        attributes: ["id", "BookName"],
        order: [["updatedAt", "ASC"]]
    });

    if (!book) {
        return { id: -1 };
    }

    let { id, BookName } = book.dataValues;
    return { id, BookName }
}

/**
 * 执行入口
 * @param {object} param 参数
 * @returns {Promise<bool>}
 */
export async function Run(param) {
    try {
        // return await Main();
        Main();
    } catch (error) {
        console.error(`[${new Date().toLocaleString()}]\t出错：`, error)
    }
}
