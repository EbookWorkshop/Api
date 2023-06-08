const Server = require("./../../Core/Server");
const Rule = require("./../../Entity/WebBook/Rule");
const ApiResponse = require("./../../Entity/ApiResponse");
const { VisualizationOfRule } = require("./../../Core/WebBook/RuleVis");

//规则可视化
//通过可视化的手段预览规则的设置情况

module.exports = () => ({
    /**
     * @swagger
     * /services/rulevis:
     *   post:
     *     tags:
     *       - Services - BotRule —— 系统服务：机器人爬网规则
     *     summary: 预览当前规则
     *     description: 根据提供的信息，在目标页面上预览规则，以验证配置是否正确
     *     parameters:
     *       - in: body
     *         name: rule
     *         description: 站点规则
     *         schema:
     *             type: object
     *             required:
     *               - testUrl
     *               - selector
     *             properties:
     *               ruleName:
     *                 type: string
     *                 enum:
     *                   - BookName
     *                   - ChapterList
     *                   - CapterTitle
     *                   - Content
     *                   - IndexNextPage
     *                   - ContentNextPage
     *               testUrl:
     *                 type: string
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
        let param = await Server.parseJsonFromBodyData(ctx, ["testUrl", "selector"]);
        if (param == null) return;

        let rule = new Rule(param.ruleName);
        rule.Selector = param.selector;

        if (Array.isArray(param.removeSelector) && param.removeSelector.length > 0) {
            rule.RemoveSelector = param.removeSelector.join(",");
        }

        if (param.getContentAction) rule.GetContentAction = param.getContentAction;
        if (param.getUrlAction) rule.GetUrlAction = param.getUrlAction;
        if (param.type == "Object" || param.type == "List") rule.Type = param.type;
        if (param.checkSetting) rule.CheckSetting = param.checkSetting;

        let ret = await VisualizationOfRule(param.testUrl, rule);

        ctx.body = new ApiResponse(ret).getJSONString();

    }
});