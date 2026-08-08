//管理站点与爬站规则之间的关系

import { GetHost } from "../Utils/SiteHelper.js";
import { WEBSITE_TIMEOUT, WEBSITE_USERAGENT, WEBSITE_SCRAPING } from "../../Entity/SystemConfigGroup.js";
import Models from "../OTO/Models/index.js";
import DO from "../OTO/DO/index.js";
import IndexOptions from "../../Entity/WebBook/IndexOptions.js";
import ChapterOptions from "../../Entity/WebBook/ChapterOptions.js";
import SystemConfigService from "../services/SystemConfig.js";



const DEFAULT_TIME_OUT = 40_000;
const DEFAULT_SCRAPING = "puppeteer";

/**
 * 规则管理器 
 */
export default class RuleManager {
    /**
     * 通过地址获得对应的规则配置
     * @param {string} url 
     */
    static async GetRuleByURL(url) {
        const host = GetHost(url);
        let result = {
            index: new IndexOptions(),
            chapter: new ChapterOptions(),
            timeout: undefined,
            userAgent: undefined,
        };

        let allRules = await RuleManager.GetRules(host);
        if (allRules.length === 0) throw ({ message: `网站尚未配置规则：${host}` });

        for (let r of allRules) {
            let curRule = null;
            switch (r.RuleName) {
                case "BookName": curRule = result.index.BookNameRule; break;
                case "ChapterList": curRule = result.index.ChapterListRule; break;
                case "IndexNextPage": curRule = result.index.NextPageRule; break;
                case "BookCover": curRule = result.index.BookCoverRule; break;
                //作者、简介等
                case "Author": curRule = result.index.AuthorRule; break;
                case "Introduction": curRule = result.index.IntroductionRule; break;

                case "CapterTitle": curRule = result.chapter.CapterTitleRule; break;
                case "Content": curRule = result.chapter.ContentRule; break;
                case "ContentNextPage": curRule = result.chapter.NextPageRule; break;
                default:
                    console.warn(`未配置规则：${r.RuleName}`);
                    break;
            }

            curRule.RuleName = r.RuleName;
            curRule.Selector = r.Selector;
            if (r.RemoveSelector) curRule.RemoveSelector = r.RemoveSelector.split(",");
            curRule.GetContentAction = r.GetContentAction;
            curRule.GetUrlAction = r.GetUrlAction;
            curRule.CheckSetting = r.CheckSetting;
            curRule.Type = r.Type;

            //设置爬文字典
            if (curRule.RuleName === "Content"/* || curRule.RuleName === "CapterTitle"*/) {
                curRule.Dictionaries = await DO.GetDictionaryByURL(host);
            }
        }

        //超时设置
        let timeout = await SystemConfigService.getConfig(WEBSITE_TIMEOUT, host);
        if (timeout) result.timeout = timeout * 1;
        else result.timeout = DEFAULT_TIME_OUT;
        //用户代理设置
        let userAgent = await SystemConfigService.getConfig(WEBSITE_USERAGENT, host);
        if (userAgent) result.userAgent = userAgent;
        //爬取方式
        let scraping = await SystemConfigService.getConfig(WEBSITE_SCRAPING, host) || DEFAULT_SCRAPING;
        result.scraping = scraping;

        return result;
    }

    /**
     * 取得规则配置的json数据
     * @param {string} url 
     * @returns {json} 返回**JSON**格式的数据
     */
    static async GetRuleJsonByURL(url) {
        let host = url.startsWith("http") ? this.GetHost(url) : url;
        let rules = await RuleManager.GetRules(host);

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

        //超时设置
        let timeout = await SystemConfigService.getConfig(WEBSITE_TIMEOUT, host);
        if (timeout) {
            rsl.push({
                ruleName: "Timeout",
                selector: timeout * 1,
            })
        }
        let userAgent = await SystemConfigService.getConfig(WEBSITE_USERAGENT, host);
        if (userAgent) {
            rsl.push({
                ruleName: "UserAgent",
                selector: userAgent,
            })
        }
        let scraping = await SystemConfigService.getConfig(WEBSITE_SCRAPING, host) || DEFAULT_SCRAPING;
        rsl.push({
            ruleName: "Scraping",
            selector: scraping,
        });
        let dict = await DO.GetDictionaryByURL(host);
        if (dict)
            rsl.push({
                ruleName: "Dictionary",
                data: dict
            });
        return rsl;
    }

    /**
     * 保存/更新网站爬取规则
     * @param { Array<Rule> } rules 
     * @returns 
     */
    static async SaveRules(rules) {
        const myModels = Models.GetPO();
        const trans = await myModels.BeginTrans();

        try {
            //全套规则删除并更新
            const oneHost = rules[0].host;
            await RuleManager.DeleteRule(oneHost, trans);

            const timeoutRule = rules.find(r => r.ruleName == "Timeout");
            if (timeoutRule && timeoutRule.selector != DEFAULT_TIME_OUT) {
                await SystemConfigService.setConfig(WEBSITE_TIMEOUT, oneHost, timeoutRule.selector, trans);
            }
            rules = rules.filter(r => r.ruleName != "Timeout");
            const userAgentRule = rules.find(r => r.ruleName == "UserAgent");
            if (userAgentRule) {
                await SystemConfigService.setConfig(WEBSITE_USERAGENT, oneHost, userAgentRule.selector, trans);
                rules = rules.filter(r => r.ruleName != "UserAgent");
            }
            const scraping = rules.find(r => r.ruleName == "Scraping");
            if (scraping && scraping.selector != DEFAULT_SCRAPING) {
                await SystemConfigService.setConfig(WEBSITE_SCRAPING, oneHost, scraping.selector, trans);
            }
            rules = rules.filter(r => r.ruleName != "Scraping");

            const dict = rules.find(d => d.ruleName == "Dictionary");
            if (dict && dict.data) {
                await DO.DeleteReviewDictionary(oneHost, trans);
                await DO.SaveDictionaries(oneHost, dict.data, trans);
                rules = rules.filter(r => r.ruleName != "Dictionary");
            }
            for (let p of rules) {
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

                let ret = await myModels.RuleForWeb.create(rule, { transaction: trans });
            }

            trans.commit();
            return true;
        } catch (e) {
            await trans.rollback();
            return false;
        }
    }

    /**
     * 将书库里所有符合网址的地址站点变更为新站点
     * @param {*} oldHost 
     * @param {*} newHost 
     * @returns 
     */
    static async ChangeHostname(oldHost, newHost) {
        const myModels = Models.GetPO();
        const trans = await myModels.BeginTrans();
        let ret = {
            success: false,
            message: "操作失败",
            data: null,
        }
        try {
            //找到关联的书籍目录
            let webBookInfo = await myModels.WebBookIndexSourceURL.findAll({
                where: { Path: { [Models.Op.like]: `%${oldHost}%` } },
                include: [{
                    model: myModels.WebBook,
                    attributes: ['id', 'BookId'],
                    include: [{ model: myModels.Ebook, attributes: ['id', 'BookName'] }]
                }],
                attributes: ["id", "Path"],
                raw: true       //自动将嵌套的关联字段用点号连接起来，形成完整的字段路径
                //即返回的Ebook表id字段自动变成列‘WebBook.Ebook.id’
            });
            for (let w of webBookInfo) {
                let { id, Path } = w;
                let newPath = Path.replace(oldHost, newHost);
                await myModels.WebBookIndexSourceURL.update({ Path: newPath }, {
                    where: { id },
                    transaction: trans
                });
            }

            //更新每章的网站路径
            let webBookChapter = await myModels.WebBookIndexURL.findAll({
                where: { Path: { [Models.Op.like]: `%${oldHost}%` } },
                attributes: ["id", "Path"],
                raw: true
            });
            for (let w of webBookChapter) {
                let { id, Path } = w;
                let newPath = Path.replace(oldHost, newHost);
                await myModels.WebBookIndexURL.update({ Path: newPath }, {
                    where: { id },
                    transaction: trans
                });
            }

            trans.commit();
            ret.data = webBookInfo.map(w => ({
                BookId: w['WebBook.Ebook.id'],
                BookName: w['WebBook.Ebook.BookName'],
            }));
            ret.success = true;
            ret.message = "操作成功";
        } catch (e) {
            await trans.rollback();
            ret.message = "操作失败，" + e.message;
        } finally {
            return ret;
        }
    }

    /**
     * 获取指定站点所有的规则
     * @param {*} host 站点
     * @returns 
     */
    static async GetRules(host) {
        let myModels = new Models();
        let allRules = await myModels.RuleForWeb.findAll({
            where: { Host: host }
        });
        return allRules;
    }

    /**
     * 删除网站对应的所有配置
     * 包含 SystemConfig 的配置
     * @param {string} host 
     */
    static async DeleteRule(host, trans) {
        const myModels = new Models();
        await myModels.RuleForWeb.destroy({
            where: {
                Host: host
            },
            transaction: trans
        });
        await SystemConfigService.delConfig(null, host, trans);
    }
}

export { RuleManager };
