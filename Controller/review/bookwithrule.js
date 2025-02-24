//爬站规则

const Models = require("../../Core/OTO/Models");
const { parseJsonFromBodyData } = require("./../../Core/Server");
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
                [myModels.Ebook, 'id', 'DESC']
            ]
        });
        let result = [];
        if (rules) {
            rules.map(item => {
                result.push({
                    id: item.id,
                    bookId: item.Ebook?.id,
                    bookName: item.Ebook?.BookName,
                    ruleId: item.ReviewRule.id,
                    ruleName: item.ReviewRule.Name
                })
            })
        }
        new ApiResponse(result).toCTX(ctx);
    },
    /**
    * @swagger
    * /review/bookwithrule:
    *   post:
    *     tags:
    *       - Review - BookWithRule —— 自助校阅 - 书与规则绑定
    *     summary: 新增设置书使用的，校阅规则
    *     description: 新增设置书使用的，校阅规则
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
        let param = await parseJsonFromBodyData(ctx, ["bookId", "ruleId"]);
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
            new ApiResponse(null, err.message, 50000).toCTX(ctx);
            return [null, null]; //return to line 87
        });
        if (rule && !created) {
            rule.BookId = param.bookId;
            rule.RuleId = param.ruleId;
            rule.save();
        }
        if (rule) new ApiResponse(rule).toCTX(ctx);
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
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }
        const myModels = new Models();
        let rules = await myModels.ReviewRuleUsing.findAll({
            where: { id: id }
        });
        rules.map((item) => item.destroy());

        new ApiResponse(rules).toCTX(ctx);
    },
});