//管理站点与爬站规则之间的关系
const DB = require("./../OTO/DatabaseHelper");
const Models = require("./../../Core/OTO/Models");
const IndexOptions = require("./../../Entity/WebBook/IndexOptions");
const ChapterOptions = require("./../../Entity/WebBook/ChapterOptions");
let { URL } = require("url");
const { where } = require("sequelize");

/**
 * 规则管理器 
 */
class RuleManager {
    /**
     * 通过地址获得对应的规则配置
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

        if (allRules.length === 0) throw ({ message: `网站尚未配置规则：${host}` });

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
                //TODO: 作者、简介等
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

    /**
     * 取得规则配置的json数据
     * @param {string} url 
     * @returns {json}
     */
    static async GetRuleJsonByURL(url) {
        let host = url.startsWith("http") ? this.GetHost(url) : url;

        const myModels = new Models();
        let rules = await myModels.RuleForWeb.findAll({
            where: {
                Host: host
            }
        });
        let rsl = [];

        for (let r of rules) {
            let {
                Host: host,
                RuleName: ruleName,
                Selector: selector,
                GetContentAction: getContentAction,
                GetUrlAction: getUrlAction,
                CheckSetting: checkSetting,
                Type: type
            } = r.dataValues;
            let temp = {
                host,
                ruleName,
                selector,
                type,
                getContentAction,
                getUrlAction,
                checkSetting,
            }
            if (r.RemoveSelector) temp.removeSelector = r.RemoveSelector.split(",");
            rsl.push(temp)
        }
        return rsl;
    }

    static async SaveRules(rules) {
        //全套规则删除并更新
        const myModels = new Models();

        for (let p of rules) {
            let oldRule = await myModels.RuleForWeb.findAll({
                where: {
                    Host: p.host,
                    RuleName: p.ruleName
                }
            });
            for(let r of oldRule) r.destroy();

            let rule = {
                Host: p.host,
                RuleName: p.ruleName,
                Selector: p.selector
            }
            if (Array.isArray(p.removeSelector) && p.removeSelector.length > 0) {
                rule.RemoveSelector = p.removeSelector.join(",");
            }
            if (p.getContentAction) rule.GetContentAction = p.getContentAction;
            if (p.getUrlAction) rule.GetUrlAction = p.getUrlAction;
            if (p.type == "Object" || p.type == "List") rule.Type = p.type;
            if (p.checkSetting) rule.CheckSetting = p.checkSetting;

            let ret = await myModels.RuleForWeb.create(rule);
        }

        return true;
    }

}





module.exports = RuleManager;