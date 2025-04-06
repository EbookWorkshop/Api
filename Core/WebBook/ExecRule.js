

/**
 * 解释规则，将当前页面的内容按配置的规则解释为提取内容
 * @param {*} page 已打开的网页
 * @param {Rule} rule 提取内容规则配置
 * @param {boolean} isVis 是否可视化展示
 * @returns {string} 提取的结果
 */
async function ExecRule(page, rule, isVis = false) {
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
        return [null];
    }
}

module.exports = {
    ExecRule
}