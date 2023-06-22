const Rule = require("../../Entity/WebBook/Rule");
const { puppeteerDebug: isDEBUG, dataPath } = require("../../config").config;
// 引入 Puppeteer 模块
const puppeteer = require('puppeteer')
const EventManager = require("../EventManager");
const { ExecRule } = require("../WebBook/ExecRule");


/**
 * 按照【规则集】提取【目标地址】中所需的内容
 * @param {string} url 目标地址
 * @param {{RuleList:Rule[]}} setting 爬取的站点配置
 */
async function GetDataFromUrl(url, setting) {
    //无界面浏览器性能更高更快，有界面一般用于调试开发
    let options = {
        //设置视窗的宽高
        defaultViewport: {
            width: 1400,
            height: 900
        },
        headless: "new",
        slowMo: 233,        //设置放慢每个步骤的毫秒数
        ignoreDefaultArgs:['--enable-automation'],      //去掉自动化提示-可能对部分反爬策略有帮助
    }
    if (isDEBUG) options.headless = false;//设置为有界面，如果为true，即为无界面
    let browser = await puppeteer.launch(options);
    let result = new Map();

    try {
        let page = await browser.newPage();
        // 配置需要访问网址
        await page.goto(url);
        //await page.exposeFunction('ActionHandle',DoAction); //在页面注册全局函数

        //接管console 网站在浏览器上发的空调信息转发到服务器控台
        if (isDEBUG) {
            page.on("console", msg => { console.log(`[浏览器]:${msg.text()}`) });
            new EventManager().emit("Debug.Puppeteer.OpenUrl", url);
            await page.screenshot({ path: `${dataPath}/Debug/a.png` });//截图
        }

        for (let rule of setting.RuleList) {
            if (rule.Selector === "") continue;

            //先尝试删除干扰元素
            for (let sR of rule.RemoveSelector)
                await page.$$eval(sR, (node, option) => {
                    for (let nO of node) nO.parentNode.removeChild(nO)
                });

            //执行规则
            result.set(rule.RuleName, await ExecRule(page, rule));
        }

    } catch (err) {
        console.warn("[执行失败]GetDataFromUrl::", err.message);
        throw err;
    } finally {
        if (browser) await browser.close(); //确保关掉以免因失败耗费内存
    }

    // 结束关闭
    return result;
}

/**
 * 多线程执行入口
 * @param {{url:string, setting:object}} param 参数
 * @returns {Promise<Map<string,any>>}
 */
async function RunTask(param) {
    return await GetDataFromUrl(param.url, param.setting);
}


/**
 * 默认的爬页规则配置
 */
const GetDataFromUrllDefaultSetting = {
    AutoNextPage: false,     //自动爬下一页
    RuleList: [],            //待爬取内容规则集合
};

function CacheFile() {

}

module.exports = {
    TimeOut: 30000,     //ms
    DefaultSetting: GetDataFromUrllDefaultSetting,
    GetDataFromUrl: GetDataFromUrl,
    RunTask
}