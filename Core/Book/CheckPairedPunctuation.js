const Models = require("../OTO/Models");

/**
 * 检查成对标点符号
 * @param {number} bookId 要查的书籍ID
 * @param {number[]|null} chapterIds 只查指定章节
 * @returns 
 */
export async function checkPairedPunctuation(bookId, chapterIds = null) {
    let where = {
        BookId: bookId,
        OrderNum: { [Models.Op.gt]: 0 },  // 只查找正序章节
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
    ];

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
            ChapterId: chapter.Id,
            ChapterName: chapter.Name,
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
                    RightCount: rightCount
                });
            }
        }
        results.push(punCheck);
    }
    return results;
}