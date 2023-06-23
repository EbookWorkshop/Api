//爬站规则

const Models = require("../../Core/OTO/Models");

const Server = require("../../Core/Server");
const ApiResponse = require("../../Entity/ApiResponse");


module.exports = () => ({
    /**
    * @swagger
    * /review/rule/list:
    *   get:
    *     tags:
    *       - Review - Rule —— 自助校阅 - 规则库
    *     summary: 自助校正的规则库
    *     description: 自助校正的规则库
    *     consumes:
    *       - application/json
    *     responses:
    *       200:
    *         description: 请求成功
    *       600:
    *         description: 参数错误，参数类型错误
    */
    "get /list": async (ctx) => {
        const myModels = new Models();
        let rules = await myModels.ReviewRule.findAll();
        new ApiResponse(rules).toCTX(ctx);
    },
    /**
    * @swagger
    * /review/rule:
    *   post:
    *     tags:
    *       - Review - Rule —— 自助校阅 - 规则库
    *     summary: 自助校正的规则库
    *     description: 自助校正的规则库
    *     parameters:
    *       - in: body
    *         name: rule
    *         description: 校阅用的规则
    *         schema:
    *             type: object
    *             required:
    *               - name
    *               - rule
    *             properties:
    *               name:
    *                 type: string
    *               rule:
    *                 type: string
    *               replace:
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
        let param = await Server.parseJsonFromBodyData(ctx, ["name", "rule"]);
        if (param == null) return;

        const myModels = new Models();
        let whereParam = { Rule: param.rule };
        if (param.id != "") whereParam = { id: param.id };
        let [rule, created] = await myModels.ReviewRule.findOrCreate({
            where: whereParam,
            defaults: {
                Name: param.name,
                Rule: param.rule,
                Replace: param.replace,
            }
        }).catch(err => {
            new ApiResponse(err, err.message, 50000).toCTX(ctx);
            return [null, null]; //return to line 70
        });
        if (!created) {
            rule.Name = param.name;
            rule.Rule = param.rule;
            rule.Replace = param.replace;
            rule.save();
        }
        if (rule) new ApiResponse(rule).toCTX(ctx);
    },
    /**
    * @swagger
    * /review/rule:
    *   delete:
    *     tags:
    *       - Review - Rule —— 自助校阅 - 规则库
    *     summary: 删除ID所属的规则
    *     description: 删除ID所属的规则
    *     parameters:
    *     - name: bookid
    *       in: query
    *       required: true
    *       description: 将要删除规则ID
    *       schema:
    *         type: integer
    *         format: int32
    *     consumes:
    *       - application/json
    *     responses:
    *       200:
    *         description: 请求成功
    *       600:
    *         description: 参数错误，参数类型错误
    */
    "delete ": async (ctx) => {
        let id = ctx.query.id;
        if (id * 1 != id) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }
        const myModels = new Models();
        let rules = await myModels.ReviewRule.findAll({
            where: { id: id }
        });
        rules.map((item) => item.destroy());

        new ApiResponse(rules).toCTX(ctx);
    },
});