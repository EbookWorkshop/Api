//爬站规则

const Models = require("./../../Core/OTO/Models");

// const DO = require("./../../Core/OTO/DO.js");
const Server = require("./../../Core/Server");


module.exports = () => ({
    /**
     * @swagger
     * /services/botrule:
     *   post:
     *     tags:
     *       - Services - BotRule —— 系统服务：机器人爬网规则
     *     summary: 创建一套用于爬站的规则
     *     description: 根据提供的信息保存爬站的规则
     *     parameters:
     *       - in: body
     *         name: rule
     *         description: 站点规则
     *         schema:
     *           type: array
     *           items:
     *             type: object
     *             required:
     *               - host
     *               - ruleName
     *               - selector
     *             properties:
     *               host:
     *                 type: string
     *               ruleName:
     *                 type: string
     *                 enum:
     *                   - BookName
     *                   - ChapterList
     *                   - CapterTitle
     *                   - Content
     *                   - IndexNextPage
     *                   - ContentNextPage
     *               selector:
     *                 type: string
     *               removeSelector:
     *                 type: array
     *                 items:
     *                   type: string
     *               getContentAction:
     *                 type: string
     *               getUrlAction:
     *                 type: string
     *               type:
     *                 type: string
     *                 default: Object
     *                 enum:
     *                   - Object
     *                   - List
     *               checkSetting:
     *                 type: string
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "post ": async (ctx) => {
        let param = await Server.parseJsonFromBodyData(ctx, ["host", "ruleName", "selector"]);
        if (param == null) return;

        let host = "";
        let hostCheck = new Set();
        for (let p of param) {
            host = p.host;
            hostCheck.add(p.host);
        }
        if (hostCheck.size != 1) {
            ctx.body = JSON.stringify({ ret: 1, err: "发现多套网站的规则，每次更新只能同一套网站。" });
            return;
        }

        //全套规则删除并更新
        const myModels = new Models();
        let rules = await myModels.RuleForWeb.findAll({
            where: {
                Host: host
            }
        });
        for (let r of rules) r.destroy();

        for (let p of param) {
            let rule = {
                Host: p.host,
                RuleName: p.ruleName,
                Selector: p.selector
            }
            if (Array.isArray(p.removeSelector) && p.removeSelector.length > 0) {
                rule.RemoveSelector = p.removeSelector.join(",");
            }
            if (p.getContentAction) rule.GetContentAction = p.getContentAction;
            if (p.getUrlAction) rule.GetUrlAction = p.getUrlAction;
            if (p.type == "Object" || p.type == "List") rule.Type = p.type;
            if (p.checkSetting) rule.CheckSetting = p.checkSetting;

            let ret = await myModels.RuleForWeb.create(rule);
        }

    },
    /**
     * @swagger
     * /services/botrule:
     *   get:
     *     tags:
     *       - Services - BotRule —— 系统服务：机器人爬网规则
     *       - TODO
     *     summary: 拿到指定站点的规则
     *     description: 拿到指定站点的规则——给UI用于展示
     *     parameters:
     *     - name: host
     *       in: query
     *       required: true
     *       description: 站点的host标识
     *       schema:
     *         type: string
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "get ": async (ctx) => {
        let host = ctx.query.host;

        ctx.body = host;
    }
});