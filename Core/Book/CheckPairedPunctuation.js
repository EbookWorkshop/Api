const Models = require("../OTO/Models");

/**
 * 检查成对标点符号
 * @param {number} bookId 要查的书籍ID
 * @param {number[]|null} chapterIds 只查指定章节
 * @returns 
 */
async function checkPairedPunctuation(bookId, chapterIds = null) {
    let where = {
        BookId: bookId,
        OrderNum: { [Models.Op.gte]: 0 },  // 只查找正序章节
        Content: { [Models.Op.ne]: null } // 确保内容不为空
    };

    if (Array.isArray(chapterIds) && chapterIds?.length > 0) {
        where.Id = { [Models.Op.in]: chapterIds };
    }

    const myModels = Models.GetPO();
    const chapters = await myModels.EbookIndex.findAll({
        where: where,
        order: [['OrderNum', 'ASC']]
    });

    if (!chapters || chapters.length <= 0) throw new Error('书籍没有章节或章节内容为空');

    const pairedPunctuation = [
        ['（', '）'],
        ['“', '”'],
        ['‘', '’'],
        // ['【', '】'],
        // ['〈', '〉'],
        ['《', '》'],
        ['「', '」'],
        ['『', '』'],
    ];//注意：成对的符号要排除[]，与正则表达式冲突

    const punchtuationLeft = new RegExp(`[${pairedPunctuation.map(p => p[0]).join('')}]`, "g");
    const punchtuationRight = new RegExp(`[${pairedPunctuation.map(p => p[1]).join('')}]`, "g");
    const results = [];

    for (const chapter of chapters) {
        const content = chapter.Content;
        if (!content) continue;

        const leftMatches = content.match(punchtuationLeft);
        const rightMatches = content.match(punchtuationRight);
        if (!leftMatches || !rightMatches) continue;

        const leftCount = leftMatches.length;
        const rightCount = rightMatches.length;
        if (leftCount == rightCount) continue;

        let punCheck = {
            BookId: bookId,
            ChapterId: chapter.id,
            ChapterName: chapter.Title,
            CheckResult: []
        };
        for (let pun of pairedPunctuation) {
            const left = pun[0];
            const right = pun[1];
            const leftCount = (content.match(new RegExp(left, "g")) || []).length;
            const rightCount = (content.match(new RegExp(right, "g")) || []).length;

            if (leftCount !== rightCount) {
                punCheck.CheckResult.push({
                    Punctuation: pun.join(''),
                    LeftCount: leftCount,
                    RightCount: rightCount,
                    Location: DistillationContent(pun, content),
                });
            }
        }
        results.push(punCheck);
    }
    return results;
}

/**
 * 定位不匹配的符号所在位置
 * @param {string[]} punctuation 符号组
 * @param {string} content 
 * @returns 
 */
function DistillationContent(punctuation, content) {
    //删除成组的符号
    let tempCont = content.replace(new RegExp(`${punctuation[0]}[^${punctuation[0]}${punctuation[1]}]+${punctuation[1]}`, 'mg'), '…');//“[^“”]+”

    //删除没符号的部分 …… 不删，用于更好的定位在文中的关系
    // tempCont = tempCont.replace(new RegExp(`^[^${punctuation[0]}${punctuation[1]}]+$`, 'mg'), '…');//[^“”]+

    //删除空行
    tempCont = tempCont.replace(/^[…\s]+?$\n?/mg, '…');//保留点换行，不删完，利于分割

    let result = [];
    let target = tempCont.matchAll(new RegExp(`${punctuation[0]}|${punctuation[1]}`, 'g'));
    let targetNext = target.next();
    const PIX = 30;
    while (!targetNext.done) {
        let index = targetNext.value.index;
        let start = Math.max(index - PIX / 2, 0);

        let sub = tempCont.substring(start, index + PIX);
        result.push(sub);

        targetNext = target.next();
    }

    return result;
}

module.exports = {
    checkPairedPunctuation
};