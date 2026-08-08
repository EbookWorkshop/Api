import puppeteer from 'puppeteer';

import { config } from "../../../services/config.js";
//import EventManager from"../../../EventManager.js";        //单例模块，在子线程使用时会新开实例导致消息丢失，不应使用
import { GetDataUseRuleFromPage } from "../Engines/rule.js"

const { debugSwitcher: { puppeteer: isDEBUG } } = config;

/**
 * 按照【规则集】提取【目标地址】中所需的内容
 * @param {string} url 目标地址
 * @param {{RuleList:Rule[],timeout:Number?}} setting 爬取的站点配置
 * @returns result<Map>
 */
export async function FetchTextByPuppeteer(url, setting) {
    const startTime = new Date();
    //无界面浏览器性能更高更快，有界面一般用于调试开发
    let options = {
        //设置视窗的宽高
        defaultViewport: {
            width: 1400,
            height: 900
        },
        headless: "new",    //默认值new：新无头模式，https://developer.chrome.com/articles/new-headless/
        slowMo: 233,        //设置放慢每个步骤的毫秒数
        ignoreDefaultArgs: ['--enable-automation'],      //去掉自动化提示-可能对部分反爬策略有帮助
        timeout: setting.timeout
    }
    if (isDEBUG) {
        options.headless = false;//设置为有界面，如果为true，即为无界面
        options.slowMo *= 5;   //放慢5倍

        //new EventManager().emit("Debug.Puppeteer.OpenUrl", url);
    }
    let browser = await puppeteer.launch(options);
    let result = new Map();

    try {
        let page = await browser.newPage();

        if (setting.userAgent) await page.setUserAgent(setting.userAgent);//设置用户代理

        // 配置需要访问网址
        await page.goto(url, { timeout: setting.timeout, waitUntil: 'networkidle2' });
        //await page.exposeFunction('ActionHandle',DoAction); //在页面注册全局函数
        result = await GetDataUseRuleFromPage(page, setting.RuleList);
        if (url != page.url()) {
            result.set("URL", {
                expect: url,
                actual: page.url(),
                message: "请求地址与实际地址不一致，发生过重定向。",
            });
        }

    } catch (err) {
        console.warn("[执行失败]FetchTextByPuppeteer::", err.message, `\t耗时：${(new Date() - startTime) / 1000}秒`, url);
        throw err;
    } finally {
        if (browser) await browser.close(); //确保关掉以免因失败耗费内存
    }

    // 结束关闭
    return result;
}
