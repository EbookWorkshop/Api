//爬站规则

const Models = require("../../Core/OTO/Models");

const Server = require("../../Core/Server");
const ApiResponse = require("../../Entity/ApiResponse");


module.exports = () => ({
    /**
    * @swagger
    * /review/bookwithrule/list:
    *   get:
    *     tags:
    *       - Review - BookWithRule —— 自助校阅 - 书与规则绑定
    *     summary: 自助校正的规则引用情况
    *     description: 自助校正的规则引用情况
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
        let rules = await myModels.ReviewRuleUsing.findAll({
            include: [myModels.Ebook, myModels.ReviewRule],
            order: [
                [myModels.Ebook, 'id', 'ASC']
            ]
        });
        let result = [];
        if (rules) {
            rules.map(item => {
                result.push({
                    id: item.id,
                    bookId: item.Ebook.id,
                    bookName: item.Ebook.BookName,
                    ruleId: item.ReviewRule.id,
                    ruleName: item.ReviewRule.Name
                })
            })
        }
        ctx.body = new ApiResponse(result).getJSONString();
    },
    /**
    * @swagger
    * /review/bookwithrule:
    *   post:
    *     tags:
    *       - Review - BookWithRule —— 自助校阅 - 书与规则绑定
    *     summary: 自助校正的规则库
    *     description: 自助校正的规则库
    *     parameters:
    *       - in: body
    *         name: rule
    *         description: 校阅用的规则
    *         schema:
    *             type: object
    *             required:
    *               - bookId
    *               - ruleId
    *             properties:
    *               bookId:
    *                 type: integer
    *                 format: int32
    *               ruleId:
    *                 type: integer
    *                 format: int32
    *     consumes:
    *       - application/json
    *     responses:
    *       200:
    *         description: 请求成功
    *       600:
    *         description: 参数错误，参数类型错误
    */
    "post ": async (ctx) => {
        let param = await Server.parseJsonFromBodyData(ctx, ["bookId", "ruleId"]);
        if (param == null) return;

        const myModels = new Models();
        let whereParam = { BookId: param.bookId, RuleId: param.ruleId };
        if (param.id) whereParam = { id: param.id };
        let [rule, created] = await myModels.ReviewRuleUsing.findOrCreate({
            where: whereParam,
            defaults: {
                BookId: param.bookId,
                RuleId: param.ruleId,
            }
        }).catch(err => {
            ctx.body = new ApiResponse(err, err.message, 50000).getJSONString();
            return null;
        });
        if (!created) {
            rule.BookId = param.bookId;
            rule.RuleId = param.ruleId;
            rule.save();
        }
        ctx.body = new ApiResponse(rule).getJSONString();
    },
    /**
    * @swagger
    * /review/bookwithrule:
    *   delete:
    *     tags:
    *       - Review - BookWithRule —— 自助校阅 - 书与规则绑定
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
            ctx.body = new ApiResponse(null, "参数错误。", 50000).getJSONString();
            return;
        }
        const myModels = new Models();
        let rules = await myModels.ReviewRuleUsing.findAll({
            where: { id: id }
        });
        rules.map((item) => item.destroy());

        ctx.body = new ApiResponse(rules).getJSONString();
    },
});