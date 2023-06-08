

/**
 * 解释规则，将当前页面的内容按配置的规则解释为提取内容
 * @param {*} page 已打开的网页
 * @param {Rule} rule 提取内容规则配置
 * @param {boolean} isVis 是否可视化展示
 * @returns {string} 提取的结果
 */
async function ExecRule(page, rule, isVis = false) {
    let querySelector = page.$eval;
    if (rule.Type === "List") querySelector = page.$$eval;

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

            if (action.startsWith("/*fun*/")) {
                var r = eval(action);
                return result || r;
            }

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
}

module.exports = {
    ExecRule
}