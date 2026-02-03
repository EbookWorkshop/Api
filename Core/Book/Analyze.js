/** 分析书籍 */

const Models = require("../OTO/Models");
const SystemConfigService = require("../services/SystemConfig"); // 假设服务类位于 Services 目录


/**
 * 
 * @param {Int16} bookId 书籍ID
 */
async function AnalyzeBookText(bookId) {
    const myModels = Models.GetPO();

    //获取章节信息
    const chapters = await myModels.EbookIndex.findAll({
        where: {
            BookId: bookId,
            Content: { [Models.Op.ne]: null },
            OrderNum: { [Models.Op.gte]: 0 }
        },
        order: [['OrderNum', 'ASC']]
    });
    if (!chapters || chapters.length <= 0) {
        throw new Error('书籍没有章节或章节内容为空');
    }
    const emptyChapters = await myModels.EbookIndex.findAll({
        where: {
            BookId: bookId,
            Content: { [Models.Op.eq]: null },
            OrderNum: { [Models.Op.gte]: 0 }
        }
    });

    //取得阅读速度基准值
    const WPM = await SystemConfigService.getConfig(
        SystemConfigService.Group.READING_HABIT,
        'speed_words_per_minute'
    ) || 250;//缺省下，以250字/分钟计算;


    // 统计
    let totalWords = 0;
    let totalParagraphs = 0;//段落数
    let chapResults = [];
    chapters.forEach(chapter => {
        let p = chapter.Content?.match(/\n+/g)?.length + 1;
        totalParagraphs += p;

        //去掉干扰字符
        let text = chapter.Content?.replace(/[\r\n\s\t,\.!?<>'"，。“”《》！？…—~\*]/g, '') || '';
        totalWords += text.length;
        chapResults.push({
            chapterId: chapter.id,
            chapterTitle: chapter.Title,
            paragraphs: p,
            words: text.length,
            readingTime: (text.length / WPM).toFixed(1),//阅读时间（分钟）
        });
    });


    return {
        totalChapters: chapters.length + emptyChapters.length,
        emptyChapters: emptyChapters.length,
        totalWords: totalWords,
        totalParagraphs: totalParagraphs,
        readingTime: (totalWords / WPM).toFixed(1),//阅读时间（分钟）
        wpm: WPM,
        avgWordsPerChapter: (totalWords / chapters.length).toFixed(2),
        avgParagraphsPerChapter: (totalParagraphs / chapters.length).toFixed(2),
        chapters: chapResults,
    };
}





module.exports = {
    AnalyzeBookText
};