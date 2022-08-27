//管理站点与爬站规则之间的关系
const DB = require("./../OTO/DatabaseHelper");
const IndexOptions = require("./../../Entity/WebBook/IndexOptions");
const ChapterOptions = require("./../../Entity/WebBook/ChapterOptions");
let { URL } = require("url");

/**
 * 规则管理器 TODO：
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


        // //TODO：需要解决目录页和阅读页二级域名不同，规则的判断情况（？？提取到一级域名？）
        // //TODO: 读取指定站点的爬取规则 先写个临时的。。 
        // switch (host) {
        //     case "qidian.com":     //起点
        //         result.index.BookNameRule.Selector = "h1 em";
        //         result.index.BookNameRule.GetContentAction = "attr/innerText";
        //         result.index.ChapterListRule.Selector = "ul.cf li a"
        //         result.index.ChapterListRule.GetContentAction = "attr/innerText";
        //         result.index.ChapterListRule.GetUrlAction = "attr/href";

        //         result.chapter.CapterTitleRule.Selector = "h3.j_chapterName span:first-child";
        //         result.chapter.CapterTitleRule.GetContentAction = "attr/innerText";
        //         result.chapter.ContentRule.Selector = ".read-content.j_readContent"
        //         result.chapter.ContentRule.GetContentAction = "attr/innerText";
        //         result.chapter.ContentRule.RemoveSelector.push(".review-count");
        //         break;
        // }

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

        let ha = host.split(".");
        if (ha.length >= 3) {
            ha.shift();
            host = ha.join(".");
        }
        return host;
    }

}





module.exports = RuleManager;