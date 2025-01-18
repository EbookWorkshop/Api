// const DO = require("./index");
// const Rule = require("./../../../Entity/WebBook/Rule");
const Models = require("./../Models");


class OTO_PDF {


    static async GetReviewRules(bookid) {
        let result = [];
        const myModels = new Models();
        let reviewRules = await myModels.ReviewRuleUsing.findAll({
            where: { BookId: bookid }
        });

        for (let rule of reviewRules) {
            let rr = await myModels.ReviewRule.findByPk(rule.RuleId)
            result.push({
                Rule: rr.Rule,
                Replace: rr.Replace
            });
        }

        return result;
    }

}


module.exports = OTO_PDF;