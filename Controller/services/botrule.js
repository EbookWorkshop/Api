//爬站规则

const RuleManager = require("../../Core/WebBook/RuleManager");
const Models = require("./../../Core/OTO/Models");
const Rule = require("./../../Entity/WebBook/Rule");
const Server = require("./../../Core/Server");
const ApiResponse = require("./../../Entity/ApiResponse");
const { VisualizationOfRule } = require("./../../Core/WebBook/RuleVis")
const fs = require('fs').promises;


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

        await RuleManager.SaveRules(param);

        new ApiResponse().toCTX(ctx);

    },

    /**
     * @swagger
     * /services/botrule:
     *   get:
     *     tags:
     *       - Services - BotRule —— 系统服务：机器人爬网规则
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
        new ApiResponse(await RuleManager.GetRuleJsonByURL(host)).toCTX(ctx);
    },
    /**
     * @swagger
     * /services/botrule:
     *   delete:
     *     tags:
     *       - Services - BotRule —— 系统服务：机器人爬网规则
     *     summary: 删除指定站点的规则
     *     description: 删除指定站点的规则
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
    "delete ": async (ctx) => {
        let host = ctx.query.host;

        const myModels = new Models();
        let rules = await myModels.RuleForWeb.findAll({
            where: {
                Host: host
            }
        });

        for (let r of rules) r.destroy();

        new ApiResponse().toCTX(ctx);
    },

    /**
     * @swagger
     * /services/botrule/hostlist:
     *   get:
     *     tags:
     *       - Services - BotRule —— 系统服务：机器人爬网规则
     *     summary: 拿到已配置规则的站点列表
     *     description: 拿到已配置规则的站点的列表
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "get /hostlist": async (ctx) => {
        const myModels = new Models();
        let rules = await myModels.RuleForWeb.findAll();
        let tempHost = new Set();
        for (let r of rules) {
            tempHost.add(r.Host)
        }
        new ApiResponse(Array.from(tempHost)).toCTX(ctx);
    },
    /**
     * @swagger
     * /services/botrule/vis:
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
    "post /vis": async (ctx) => {
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

        new ApiResponse(ret).toCTX(ctx);
    },
    /**
     * @swagger
     * /services/botrule/export:
     *   get:
     *     tags:
     *       - Services - BotRule —— 系统服务：机器人爬网规则
     *     summary: 导出指定站点的规则
     *     description: 导出指定站点的规则——用于备份，数据迁移等
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
    "get /export": async (ctx) => {
        let host = ctx.query.host;
        ctx.body = JSON.stringify(await RuleManager.GetRuleJsonByURL(host));
        ctx.set("Content-Type", "application/octet-stream");
        ctx.set("Content-Disposition", `attachment;filename=EBW_botrule_export_${host}.json`);

    },

    /**
     * @swagger
     * /services/botrule/import:
     *   post:
     *     tags:
     *       - Services - BotRule —— 系统服务：机器人爬网规则
     *     summary: 导入指定站点的规则
     *     description: 导入指定站点的规则——用于备份，数据迁移等
     *     parameters:
     *     - name: data
     *       in: formData
     *       required: true
     *       description: 导入的json文件
     *       type: file
     *     consumes:
     *       - multipart/form-data
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "post /import": async (ctx) => {
        const file = ctx.request.files.data;
        if (!file) {
            new ApiResponse(null, "未找到上传的文件", 60000).toCTX(ctx);
            return;
        }


        try {
            const data = await fs.readFile(file.filepath, 'utf8');
            const rules = JSON.parse(data);

            if (!Array.isArray(rules)) {
                new ApiResponse(null, "文件内容格式错误", 60000).toCTX(ctx);
                return;
            }

            let result =await RuleManager.SaveRules(rules);

            new ApiResponse(rules, "设置成功").toCTX(ctx);
        } catch (error) {
            new ApiResponse(null, "文件处理错误：" + error, 50000).toCTX(ctx);
        }
    }
});