const Rule = require("../../Entity/WebBook/Rule");
const { config: { dataPath, debugSwitcher } } = require("../services/config");
// 引入 Puppeteer 模块
const puppeteer = require('puppeteer')
const Iconv = require('iconv-lite');
// const {EventManager} = require("../EventManager");         //单例模块，在子线程使用时会新开实例导致消息丢失，不应使用
const { ExecRule } = require("../WebBook/ExecRule");
const { UseDictReplace, isExec } = require("../WebBook/ExecDict");

const { puppeteer: isDEBUG } = debugSwitcher;

/**
 * 按照【规则集】提取【目标地址】中所需的内容
 * @param {string} url 目标地址
 * @param {{RuleList:Rule[],timeout:Number?}} setting 爬取的站点配置
 */
async function FetchTextByPuppeteer(url, setting) {
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

        new EventManager().emit("Debug.Puppeteer.OpenUrl", url);
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


/**
 * 尝试直接获取网址的文本内容
 * 注意网页中的脚本可能加载不了
 * @param {string} url 
 * @param {object} setting
 */
async function FetchTextByHttp(url, setting) {
    const htmlSourceString = await requestTextByHttp(url, setting);
    return await parseHtmlString(htmlSourceString, url, setting);
}

/**
 * 
 * @param {*} url 
 * @param {*} setting 
 * @returns {string} 返回网页源码
 */
async function requestTextByHttp(url, setting) {
    try {
        const { URL } = require("url");
        let tUrl = new URL(url);
        const isHttps = tUrl.protocol === "https:";

        let options = {
            method: "GET",
            timeout: setting.timeout,
            headers: {
                'Content-Type': `application/x-www-form-urlencoded`,
                ...(setting.userAgent ? { 'User-Agent': setting.userAgent } : {}),
            },
            hostname: tUrl.hostname,
            path: tUrl.pathname + (tUrl.search || ""),
            port: tUrl.port,
            ...(isHttps ? { rejectUnauthorized: false } : {}),
        };

        let client = isHttps ? require("node:https") : require("node:http");

        return await new Promise((resolve, reject) => {
            client.request(options, (res) => {
                const chunks = [];
                res.on("data", chunk => { chunks.push(chunk); });
                res.on("error", err => reject(err));
                res.on("end", () => {
                    try {
                        // 合并所有字节后再解码（避免跨包截断）
                        const buffer = Buffer.concat(chunks);
                        const htmlString = buffer.toString("utf-8");

                        // 检测实际编码
                        let charset = detectCharset(res.headers, htmlString.substring(0, Math.min(htmlString.length, 8192)));

                        // 解码
                        let result = "";
                        if (charset === 'utf-8' || charset === 'utf8') {
                            result = htmlString;
                        } else {
                            const iconv = require('iconv-lite');
                            result = iconv.decode(buffer, charset);
                        }

                        resolve(result);
                    } catch (err) {
                        reject(new Error(`解码失败: ${err.message}`));
                    }
                });
            }).end();
        })
    } catch (err) {
        console.warn("[执行失败]FetchTextByHttp::", err.message, url);
        throw err;
    }
}

/**
 * 解释字符串，获取配置的规则提取内容
 * 以Dom方式提取
 * @param {*} htmlString 
 * @param {*} setting 
 * @returns 
 */
async function parseHtmlString(htmlString, url, setting) {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // 将传入的 HTML 字符串设置为页面内容
    //    'about:blank' 是目标URL，核心是 setContent 方法
    await page.setContent(htmlString, {
        waitUntil: 'networkidle0' // 等待网络和脚本加载完成
    });

    let result = new Map();
    result = await GetDataUseRuleFromPage(page, setting.RuleList);
    await browser.close();

    //整理结果-将相对地址改为绝对地址
    let tUrl = new URL(url);
    for (let r of result.values()) {
        for (let v of r) {
            if (v.url && v.url.startsWith("/")) v.url = `${tUrl.origin}${v.url}`;       //需要换算相对地址
        }
    }

    return result;
}

/**
 * 获取网页的实际编码方式
 * * 通过请求头的Content-Type获取
 * * 通过网页源码的meta标签charset属性获取
 * @param {*} headers 
 * @param {*} html 
 * @returns 小写格式 字符编码
 */
function detectCharset(headers, html) {
    // 1. 优先从 Content-Type 获取
    const ct = headers["content-type"] || "";
    const charsetMatch = ct.match(/charset\s*=\s*([^\s;]+)/i);
    if (charsetMatch) {
        return charsetMatch[1].toLowerCase();
    }

    // 2. 从 HTML meta 标签检测
    const metaMatch = html.match(/<meta[^>]*charset\s*=\s*["']?([^"'\s>]+)/i);
    if (metaMatch) {
        return metaMatch[1].toLowerCase();
    }

    return 'utf-8';
}

/**
 * 从页面对象中，通过规则抓取实际数据
 * @param {*} page 
 * @param {*} Rules 
 * @returns 
 */
async function GetDataUseRuleFromPage(page, Rules) {
    let result = new Map();

    if (isDEBUG) {
        //接管console 网站在浏览器上发的空调信息转发到服务器控台
        page.on("console", msg => { console.log(`[浏览器]:${msg.text()}`) });
        await page.screenshot({ path: `${dataPath}/Debug/Test_${Date.now()}.png` });//截图
        result.set("source", { text: await page.content() });   //记录页面源代码
    }

    for (let rule of Rules) {
        //执行规则
        let ruleRsl = await ExecRule(page, rule);
        if (rule.RuleName === "Content") {
            await Promise.all(
                rule.Dictionaries.map(async (item) => {
                    item.isExecute = await isExec(page, item);
                })
            );

            const bigDict = rule.Dictionaries.filter(item => item.isExecute).map(d => d.Data).join("\n");
            for (let rr of ruleRsl) {
                rr.text = UseDictReplace(bigDict, rr.text);
            }
        }
        result.set(rule.RuleName, ruleRsl);
    }
    return result;
}



/**
 * 多线程执行入口
 * @param {{url:string, setting:object}} param 参数
 * @returns {Promise<Map<string,any>>}
 */
async function RunTask(param) {
    let result = null;
    const { setting, url } = param;
    if (setting.scraping === "http") {
        result = await FetchTextByHttp(url, setting);
    } else {        //if (param.scraping === "puppeteer")
        result = await FetchTextByPuppeteer(url, setting);
    }
    return result
}


/**
 * 默认的爬页规则配置
 */
const GetDataFromUrllDefaultSetting = {
    AutoNextPage: false,     //自动爬下一页
    RuleList: [],            //待爬取内容规则集合
};


module.exports = {
    TimeOut: 30000,     //ms
    DefaultSetting: GetDataFromUrllDefaultSetting,
    // GetDataFromUrl: GetDataFromUrl,
    RunTask
}