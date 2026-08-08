//规则可视化
import puppeteer from 'puppeteer';
import Rule from "../../Entity/WebBook/Rule.js";
import { ExecRule } from "../Utils/GetDataFromUrl/Engines/rule.js";

//浏览器
let curBrowser = null;
let lastPage = null;

/**
 * 规则命中可视化配置
 * @param {string} url 
 * @param {Rule} rule 
 */
export async function VisualizationOfRule(url, rule) {
    let browser = await GetBrowser();
    let page = lastPage;
    let curTime = new Date().getTime()
    if (page == null || page.isClosed()) {
        page = await browser.newPage();
        lastPage = page;
    }

    if (!page.url() !== url) await page.goto(url); //相同的页面不再刷新

    let rsl = await ExecRule(page, rule, true);
    return rsl;
}

async function GetBrowser() {
    if (curBrowser == null || !curBrowser?.connected) {         //已断开的浏览器对象，就重新创建
        if (curBrowser && !curBrowser.connected) curBrowser.close();
        let options = {
            //设置视窗的宽高
            defaultViewport: null,//不设置具体视口大小，可以用最大化调整窗口大小
            headless: false,        //设置为有界面，如果为new，即为无界面
            slowMo: 100        //设置放慢每个步骤的毫秒数
        }
        curBrowser = await puppeteer.launch(options);
    }

    return curBrowser;
}



// let testRule = new Rule("test");
// testRule.Selector = ".detailTopLeft img";
// testRule.GetContentAction = "attr/src";
// VisualizationOfRule("", testRule);
