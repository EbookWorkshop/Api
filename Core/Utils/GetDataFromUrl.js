const Rule = require("../../Entity/WebBook/Rule");
const { config: { dataPath, debugSwitcher } } = require("../services/config");
// 引入 Puppeteer 模块
const puppeteer = require('puppeteer')
const Iconv = require('iconv-lite');
const EventManager = require("../EventManager");
const { ExecRule } = require("../WebBook/ExecRule");

const isDEBUG = debugSwitcher.puppeteer;

/**
 * 按照【规则集】提取【目标地址】中所需的内容
 * @param {string} url 目标地址
 * @param {{RuleList:Rule[],timeout:Number?}} setting 爬取的站点配置
 */
async function GetDataFromUrl(url, setting) {
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
    }
    let browser = await puppeteer.launch(options);
    let result = new Map();

    try {
        let page = await browser.newPage();

        if (setting.userAgent) await page.setUserAgent(setting.userAgent);//设置用户代理

        // 配置需要访问网址
        await page.goto(url, { timeout: setting.timeout, waitUntil: 'networkidle2' });
        //await page.exposeFunction('ActionHandle',DoAction); //在页面注册全局函数
        if (url != page.url()) {
            result.set("URL", {
                expect: url,
                actual: page.url(),
                message: "请求地址与实际地址不一致，发生过重定向。",
            })
        }

        //接管console 网站在浏览器上发的空调信息转发到服务器控台
        if (isDEBUG) {
            page.on("console", msg => { console.log(`[浏览器]:${msg.text()}`) });
            new EventManager().emit("Debug.Puppeteer.OpenUrl", url);
            await page.screenshot({ path: `${dataPath}/Debug/Test_${Date.now()}.png` });//截图
        }

        for (let rule of setting.RuleList) {
            if (rule.Selector === "") continue;

            //执行规则
            result.set(rule.RuleName, await ExecRule(page, rule));
        }

    } catch (err) {
        console.warn("[执行失败]GetDataFromUrl::", err.message);
        //进行方案二的重试
        setting.url = url;
        let body = await GetStringFromURL(url, setting.timeout);
        result = await parseHtmlString(body, setting);
        if (result.size == 0) throw err;     //重试也失败，抛出错误
    } finally {
        if (browser) await browser.close(); //确保关掉以免因失败耗费内存
    }

    // 结束关闭
    return result;
}


/**
 * 尝试直接获取网址的文本内容
 * 在无头浏览器获取内容失败后，常识直接请求源码……
 * @param {*} url 
 */
async function GetStringFromURL(url, timeout) {
    try {
        let { URL } = require("url");
        let tUrl = new URL(url);
        let options = {
            method: "GET",
            timeout: timeout,
            headers: {
                'Content-Type': `application/x-www-form-urlencoded`,
            },
            hostname: tUrl.hostname,
            path: tUrl.pathname + (tUrl.search || ""),
            port: tUrl.port
        };

        let client = null;
        switch (tUrl.protocol) {
            case "http:":
                client = require("http");
                break;
            case "https:":
                client = require("https");
                options.rejectUnauthorized = false; //忽略证书验证
                break;
        }

        return await new Promise((resolve, reject) => {
            let req = client.request(options, (res) => {
                let result = "";
                const ct = res.headers["content-type"];
                let charset = ct.includes("charset=") ? ct.split("charset=")[1] : "utf-8";

                res.on("data", chunk => {
                    result += Iconv.decode(chunk, charset);
                });
                res.on("end", () => {
                    resolve(result);
                });
                res.on("error", err => reject(err));
            });
            req.end();
        })
    } catch (err) {
        console.warn("[GetStringFromURL]错误：", err.message);
    }

}

async function parseHtmlString(htmlString, setting) {
    // 1. 启动无头浏览器
    const browser = await puppeteer.launch({ headless: "new" });
    // 2. 打开一个新页面
    const page = await browser.newPage();

    // 3. 将传入的 HTML 字符串设置为页面内容
    //    'about:blank' 是目标URL，核心是 setContent 方法
    await page.setContent(htmlString, {
        waitUntil: 'networkidle0' // 等待网络和脚本加载完成
    });

    let result = new Map();
    for (let rule of setting.RuleList) {
        if (rule.Selector === "") continue;
        //执行规则
        result.set(rule.RuleName, await ExecRule(page, rule));
    }

    // 5. 关闭浏览器
    await browser.close();

    //整理结果-将相对地址改为绝对地址
    let tUrl = new URL(setting.url);
    for (let r of result.values()) {
        for (let v of r) {
            if (v.url && v.url.startsWith("/")) v.url = `${tUrl.origin}${v.url}`
        }
    }

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


module.exports = {
    TimeOut: 30000,     //ms
    DefaultSetting: GetDataFromUrllDefaultSetting,
    GetDataFromUrl: GetDataFromUrl,
    RunTask
}