import Models from "../Models/index.js";


export default class OTO_ReviewRule {
    static async GetReviewRules(bookid) {
        const myModels = new Models();

        const results = await myModels.ReviewRuleUsing.findAll({
            where: { BookId: bookid },
            attributes: [], // 只取关联表数据，不返回自身字段
            include: [{
                model: myModels.ReviewRule,
                attributes: ['Rule', 'Replace'] // 只取需要的字段
            }]
        });

        // 映射取出关联的数据
        return results.map(item => ({
            Rule: item.ReviewRule?.Rule,
            Replace: item.ReviewRule?.Replace
        }));
    }
}
