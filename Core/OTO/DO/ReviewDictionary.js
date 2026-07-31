const Models = require("../Models");
const SiteHelper = require("../../Utils/SiteHelper");


/**
 * ReviewDictionary 的读写操作
 */
class OTO_ReviewDictionary {
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
        await myModels.ReviewDictionary.destroy({
            where: {
                Host: host
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


module.exports = OTO_ReviewDictionary;