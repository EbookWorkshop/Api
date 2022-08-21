//管理站点与爬站规则之间的关系

const IndexOptions = require("./../../Entity/WebBook/IndexOptions.js");
const ChapterOptions = require("./../../Entity/WebBook/ChapterOptions.js");
let { URL } = require("url");

/**
 * 规则管理器 TODO：
 */
class RuleManager {
    /**
     * 
     * @param {*} url 
     */
    static GetRuleByURL(url) {
        const host = RuleManager.GetHost(url);
        let result = {
            index: new IndexOptions(),
            chapter: new ChapterOptions()
        };

        //TODO：需要解决目录页和阅读页二级域名不同，规则的判断情况（？？提取到一级域名？）
        //TODO: 读取指定站点的爬取规则 先写个临时的。。 
        switch (host) {
            case "qidian.com":     //起点
                result.index.BookNameRule.Selector = "h1 em";
                result.index.BookNameRule.GetContentAction = "attr/innerText";
                result.index.ChapterListRule.Selector = "ul.cf li a"
                result.index.ChapterListRule.GetContentAction = "attr/innerText";
                result.index.ChapterListRule.GetUrlAction = "attr/href";

                result.chapter.CapterTitleRule.Selector = "h3.j_chapterName span:first-child";
                result.chapter.CapterTitleRule.GetContentAction = "attr/innerText";
                result.chapter.ContentRule.Selector = ".read-content.j_readContent"
                result.chapter.ContentRule.GetContentAction = "attr/innerText";
                result.chapter.ContentRule.RemoveSelector.push(".review-count");
                break;
            case "lingdiankanshu.co":     //零点 章节页分页样本
                result.index.BookNameRule.Selector = "meta[property='og:novel:book_name']";
                result.index.BookNameRule.GetContentAction = "attr/content";
                result.index.ChapterListRule.RemoveSelector.push(".section-box:nth-child(2)")
                result.index.ChapterListRule.Selector = ".section-box li a"
                result.index.ChapterListRule.GetContentAction = "attr/innerText";
                result.index.ChapterListRule.GetUrlAction = "attr/href";
                result.index.NextPageRule.Selector = ".listpage .right a";
                result.index.NextPageRule.GetContentAction = "attr/innerText";
                result.index.NextPageRule.GetUrlAction = "attr/href";

                result.chapter.CapterTitleRule.RemoveSelector.push(".posterror");
                result.chapter.CapterTitleRule.RemoveSelector.push(".amiddle");
                result.chapter.CapterTitleRule.Selector = "h1.title";
                result.chapter.CapterTitleRule.GetContentAction = "attr/innerText";
                result.chapter.ContentRule.RemoveSelector.push("h1");
                result.chapter.ContentRule.Selector = ".content"
                result.chapter.ContentRule.GetContentAction = "attr/innerText";

                result.chapter.NextPageRule.Selector = ".section-opt:first-child a:nth-child(5)";//下一页按钮
                result.chapter.NextPageRule.GetContentAction = "attr/innerText";
                result.chapter.NextPageRule.GetUrlAction = "attr/href";
                result.chapter.NextPageRule.CheckSetting = "下一页";
                break;
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

        let ha = host.split(".");
        if (ha.length >= 3) {
            ha.shift();
            host = ha.join(".");
        }
        return host;
    }

}





module.exports = RuleManager;