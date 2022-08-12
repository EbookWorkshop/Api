// 引入 Puppeteer 模块
let puppeteer = require('puppeteer')


/**
 * 按照【规则集】提取【目标地址】中所需的内容
 * @param {*} url 目标地址
 * @param {Object} setting 爬取的站点配置
 */
async function GetDataFromUrl(url, setting) {
    //无界面浏览器性能更高更快，有界面一般用于调试开发
    let options = {
        //设置视窗的宽高
        defaultViewport: {
            width: 1400,
            height: 800
        },
        //headless: false,        //设置为有界面，如果为true，即为无界面
        slowMo: 250        //设置放慢每个步骤的毫秒数
    }
    let browser = await puppeteer.launch(options);
    // 打来新页面
    let page = await browser.newPage();
    // 配置需要访问网址
    await page.goto(url);
    //接管console
    page.on("console", msg => { console.log(`[浏览器]:${msg.text()}`) });

    //await page.exposeFunction('ActionHandle',DoAction); //注册函数


    let result = new Map();
    for (let rule of setting.RuleList) {
        if (rule.Selector === "") continue;

        result.set(rule.RuleName, await ExecRule(page, rule));
    }

    // 结束关闭
    await browser.close();
    return result;
}


/**
 * 解释规则，将当前页面的内容按配置的规则解释为提取内容
 * @param {*} page 已打开的网页
 * @param {*} rule 提取内容规则配置
 * @returns 
 */
async function ExecRule(page, rule) {
    let querySelector = page.$eval;
    if (rule.Type === "List") querySelector = page.$$eval;

    let rsl = await querySelector.call(page, rule.Selector, (node, option) => {
        //动作表达式解释处理器 只能定义在浏览器端，对象不能序列化在服务器执行会失效
        let ActionHandle = (action, obj) => {
            if (action == undefined) return;

            let acExp = action.split("/");
            let result;
            switch (acExp[0]) {
                case "attr":
                    result = obj[acExp[1]];
                    break;
                case "fun":
                    result = obj[acExp[1]](acExp[2]);
                    break;
                case "reg":
                    result = "ToDo";
                    break;
            }
            return result;
        }


        let myRsl = [];
        if (option.Type !== "List") {
            node = [node];
        }

        for (let n of node) {
            let curObj = { Rule: option };
            curObj.text = ActionHandle(option.GetContentAction, n);
            curObj.url = ActionHandle(option.GetUrlAction, n);
            myRsl.push(curObj);
        }
        return myRsl;
    }, rule);
    return rsl;
}

/**
 * 默认的爬页规则配置
 */
const GetDataFromUrllDefaultSetting = {
    AutoNextPage: false,     //自动爬下一页
    RuleList: [],            //待爬取内容规则集合
};

// exports.GetDataFromUrl = GetDataFromUrl;
// exports.DefaultSetting = GetDataFromUrllDefaultSetting;

module.exports = {
    TimeOut: 30000,     //ms
    DefaultSetting: GetDataFromUrllDefaultSetting,
    GetDataFromUrl: GetDataFromUrl,
}