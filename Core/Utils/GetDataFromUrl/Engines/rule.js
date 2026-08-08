import { isExec, UseDictReplace } from "./dictionary.js";
import { config } from "../../../services/config.js";

const { debugSwitcher: { puppeteer: isDEBUG } } = config;

/**
 * 从页面对象中，通过规则抓取实际数据
 * @param {*} page 
 * @param {*} Rules 
 * @returns 
 */
export async function GetDataUseRuleFromPage(page, Rules) {
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
 * 解释规则，将当前页面的内容按配置的规则解释为提取内容
 * @param {*} page 已打开的网页
 * @param {Rule} rule 提取内容规则配置
 * @param {boolean} isVis 是否可视化展示
 * @returns {string} 提取的结果
 */
export async function ExecRule(page, rule, isVis = false) {
    //先尝试删除干扰元素
    if (typeof (rule.RemoveSelector) === "string") rule.RemoveSelector = [rule.RemoveSelector];
    for (let sR of rule.RemoveSelector)
        try {
            await page.$$eval(sR, (node, isVis) => {
                for (let nO of node)
                    if (!isVis)
                        nO.parentNode.removeChild(nO);
                    else
                        nO.style.border = "5px solid blue";
            }, isVis);
        } catch (err) { }//尝试删除干扰元素，失败不管

    if (rule.Selector === "") return [];
    let querySelector = page.$eval;
    if (rule.Type === "List") querySelector = page.$$eval;

    try {
        //注意：下述代码块运行在浏览器端
        let rsl = await querySelector.call(page, rule.Selector, (node, option, isVis) => {
            /**
             * 动作表达式解释处理器 
             * 只能定义在浏览器端，对象不能序列化
             * 在服务器执行会失效
             * @param {*} action 动作表达式，如：attr/innerText
             * @param {*} myNode 已命中的node对象
             * @returns {text,url}
             */
            let ActionHandle = (action, myNode) => {
                if (action == undefined) return;
                let result;

                /**
                 * 配置的动作表达式
                 */
                let acExp = action.split("/");
                switch (acExp[0]) {
                    case "attr":
                        result = myNode[acExp[1]];
                        break;
                    case "cache":       //缓存的
                        result = "cache::" + myNode[acExp[1]];
                        break;
                    case "fun":         //执行节点上的方法
                        result = myNode[acExp[1]](...acExp.slice(2));
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

                if (isVis) {
                    n.style.border = "5px solid red";
                    n.title = `${curObj.url}\n${curObj.text}`
                }
            }
            return myRsl;
        }, rule, isVis);

        return rsl;
    } catch (err) {
        //没抓到数据
        return [err.message, err, await page.content()];
    }
}
