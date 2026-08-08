import Models from "../Models/index.js";
import * as SiteHelper from "../../Utils/SiteHelper.js";


/**
 * ReviewDictionary 的读写操作
 */
export default class OTO_ReviewDictionary {
    static async GetDictionaryByURL(url) {
        const host = SiteHelper.GetHost(url);
        const myModels = Models.GetPO();
        const dict = await myModels.ReviewDictionary.findAll({
            where: { Host: host },
            raw: true   // 直接返回普通对象数组
        })
        return dict;
    }

    static async DeleteReviewDictionary(host, trans) {
        const myModels = new Models();
        const Op = Models.Op;
        await myModels.ReviewDictionary.destroy({
            where: {
                [Op.or]: [
                    { Host: host },
                    { Host: { [Op.notIn]: myModels.sequelize.literal('(SELECT Host FROM RuleForWebs)') } }
                ]
            },
            transaction: trans
        });
    }

    static async SaveDictionaries(host, data, trans) {
        try {
            const myModels = new Models();
            for (let d of data) {
                await myModels.ReviewDictionary.create({
                    Host: host,
                    ExecuteType: d.ExecuteType,
                    Execute: d.Execute,
                    Data: d.Data,
                }, { transaction: trans })
            }
            return true;
        } catch (err) { return false; }
    }
}
