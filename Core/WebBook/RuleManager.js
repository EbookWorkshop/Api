//管理站点与爬站规则之间的关系
const DB = require("./../OTO/DatabaseHelper");
const IndexOptions = require("./../../Entity/WebBook/IndexOptions");
const ChapterOptions = require("./../../Entity/WebBook/ChapterOptions");
let { URL } = require("url");

/**
 * 规则管理器 
 */
class RuleManager {
    /**
     * 
     * @param {*} url 
     */
    static async GetRuleByURL(url) {
        const host = RuleManager.GetHost(url);
        let result = {
            index: new IndexOptions(),
            chapter: new ChapterOptions()
        };

        let allRules = await DB.Models().RuleForWeb.findAll({
            where: { Host: host }
        });

        for (let r of allRules) {
            let curRule = null;
            switch (r.RuleName) {
                case "BookName": curRule = result.index.BookNameRule; break;
                case "ChapterList": curRule = result.index.ChapterListRule; break;
                case "IndexNextPage": curRule = result.index.NextPageRule; break;
                case "BookCover": curRule = result.index.BookCoverRule; break;

                case "CapterTitle": curRule = result.chapter.CapterTitleRule; break;
                case "Content": curRule = result.chapter.ContentRule; break;
                case "ContentNextPage": curRule = result.chapter.NextPageRule; break;
            }

            curRule.RuleName = r.RuleName;
            curRule.Selector = r.Selector;
            if (r.RemoveSelector) curRule.RemoveSelector = r.RemoveSelector.split(",");
            curRule.GetContentAction = r.GetContentAction;
            curRule.GetUrlAction = r.GetUrlAction;
            curRule.CheckSetting = r.CheckSetting;
        }

        return result;
    }


    /**
     * 根据网址返回对应的站点
     * @param {string} url 需要分析的网址
     * @returns 返回纯粹的域名如 www.abc.com
     */
    static GetHost(url) {
        // url = url.replace(/https?:\/\//, "");
        // return url.indexOf("/") == -1 ? url : url.substr(0, url.indexOf("/"));

        let urlObj = new URL(url);

        let host = urlObj.host;

        //去掉二级域名——已经可以方便复制配置，不需要
        // let ha = host.split(".");
        // if (ha.length >= 3) {
        //     ha.shift();
        //     host = ha.join(".");
        // }
        return host;
    }

}





module.exports = RuleManager;