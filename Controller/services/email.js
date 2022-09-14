//发邮件 邮箱管理
const Server = require("./../../Core/Server");
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const EventManager = require("./../../Core/EventManager");
const path = require('path')
const ApiResponse = require("./../../Entity/ApiResponse");
const Models = require("./../../Core/OTO/Models");


const EMAIL_SETTING_GROUP = "send_email_account";       //系统设置-邮箱的配置分组
const KINDLE_INBOX = "kindle_inbox";                   //系统设置-收件箱-可用于kindle的收件箱


/**
 * 通过发件地址推测出邮箱服务器地址
 * @param {*} user 发件人邮箱 如：mailuser@163.com
 * @returns 发件人所在邮箱服务器 如：163
 */
function GetServer(user) {
    return user.match(/(?<=@)[^.]+/)[0];
}

/**
 * 获得一个发送管道
 * @param {*} user 发件人地址
 * @param {*} pass 授权密码
 * @returns 
 */
function CreateTransport(user, pass) {
    let setting = {
        service: GetServer(user),
        auth: {
            user: user,
            pass: pass
        }
    };
    return nodemailer.createTransport(smtpTransport(setting));
}

/**
 * 发封邮件
 * @param {{ title, content, files, mailto, sender, pass }} 邮件属性
 * @param {Array} files 文件要求相对地址数组，会自动拆分成系统接口所需格式:`{filename,path}` 或者 `{filename,content,contentType:'text/plain'}`指定文件格式
 */
async function SendAMail({ title, content, files, mailto = "", sender = "", pass = "" }) {
    return new Promise(async (resolve, reject) => {
        try {
            // console.log("准备发送邮件：", title, content, files)

            const myModels = new Models();

            if (mailto === "") {
                let mt = await myModels.SystemConfig.findOne({
                    where: {
                        Group: KINDLE_INBOX,
                        Name: "address"
                    }
                });
                if (mt) mailto = mt.Value;
            }
            if (sender === "") {
                let mt = await myModels.SystemConfig.findOne({
                    where: {
                        Group: EMAIL_SETTING_GROUP,
                        Name: "address"
                    }
                });
                if (mt) sender = mt.Value;
                let pt = await myModels.SystemConfig.findOne({
                    where: {
                        Group: EMAIL_SETTING_GROUP,
                        Name: "password"
                    }
                });
                if (pt) pass = pt.Value;
            }

            if (sender === "" || mailto === "" || pass === "") {
                reject("默认邮箱配置不完整，不能发送邮件，请先在系统设置收/发件信息；或直接指定收/发件信息。");
                return;
            }

            //邮件属性——邮件的详细信息
            var mailOptions = {
                from: sender,
                to: mailto,
                subject: title || "Send the e-mail by default",
                text: content || "This e-mail sent by EBookWorkshop!",
                attachments: []     //附件地址，需要相对地址
            };

            //添加附件-将附件按插件发送要求转换
            if (files) {        //NOTE: 这儿会有将服务器任意文件通过邮件发出去的bug，会泄露服务器信息。
                //mailOptions.attachments = files.concat();
                for (let f of files) {
                    mailOptions.attachments.push({
                        filename: f.split("/").pop(),
                        path: path.resolve(__dirname, "./../../", f)
                    });
                }
            }

            CreateTransport(sender, pass).sendMail(mailOptions, function (error, info) {
                if (error) {
                    //console.log("【SMTP】发送邮件失败：", error);
                    new EventManager().emit("Services.EMail.Send.Fail", title, files, mailto, sender);
                    reject(error)
                } else {
                    //console.log("【SMTP】邮件发送完成。");
                    new EventManager().emit("Services.EMail.Send.Success", title, files, mailto, sender);
                    resolve();
                }
            });
        }
        catch (err) {
            console.error("尝试发送邮件时失败：", err);
            reject(err);
        }
    });
}

module.exports = () => ({
    /**
     * @swagger
     * /services/email/send:
     *   post:
     *     tags:
     *       - Services - EMail —— 系统服务：邮件
     *     summary: 通过简易的SMTP服务发送邮件
     *     description: 可以发一封邮件，能带附件，如果没有发件人/收件人信息，则默认从系统配置里读取
     *     parameters:
     *       - in: body
     *         name: email
     *         description: 邮件信息
     *         schema:
     *             type: object
     *             required:
     *               - files
     *             properties:
     *               title:
     *                 type: string
     *               content:
     *                 type: string
     *               mailto:
     *                 type: string
     *               files:
     *                 type: array
     *                 items:
     *                   type: string
     *               sender:
     *                 type: string
     *               pass:
     *                 type: string
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "post /send": async (ctx) => {
        let param = await Server.parseJsonFromBodyData(ctx, ["files"]);
        if (param == null) return;

        // new EventManager().emit("Debug.Log", "GetIn!!")
        let backRsl = new ApiResponse();

        await SendAMail(param).then(result => {
        }).catch((err) => {
            backRsl.code = 50000;
            backRsl.msg = err.message;
        }).finally(() => {
            ctx.body = backRsl.getJSONString();
        });
    },

    /**
     * @swagger
     * /services/email/account:
     *   post:
     *     tags:
     *       - Services - EMail —— 系统服务：邮件
     *     summary: 设置默认邮箱账户
     *     description: 设置一个账户，用于默认发送邮件，需要提供邮箱地址及认证密码
     *     parameters:
     *       - in: body
     *         name: account
     *         description: 发邮件的邮箱账户
     *         schema:
     *             type: object
     *             required:
     *               - address
     *               - password
     *             properties:
     *               address:
     *                 type: string
     *               password:
     *                 type: string
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "post /account": async (ctx) => {
        let backRsl = new ApiResponse();

        let param = await Server.parseJsonFromBodyData(ctx, ["address", "password"]);
        if (param == null) {
            backRsl.code = 50000;
            backRsl.msg = "参数错误。";
            ctx.body = backRsl.getJSONString();
            return;
        }

        const myModels = new Models();
        let settings = await myModels.SystemConfig.findAll({
            where: {
                Group: EMAIL_SETTING_GROUP
            }
        });
        for (let s of settings) s.destroy();

        await myModels.SystemConfig.create({
            Group: EMAIL_SETTING_GROUP,
            Name: "address",
            Value: param.address,
        }).then(() => {
            return myModels.SystemConfig.create({
                Group: EMAIL_SETTING_GROUP,
                Name: "password",
                Value: param.password,
            });
        }).then(result => {
            //全部成功
        }).catch((err) => {
            backRsl.code = 50000;
            backRsl.msg = err.message;
        }).finally(() => {
            ctx.body = backRsl.getJSONString();
        });
    },

    /**
     * @swagger
     * /services/email/account:
     *   get:
     *     tags:
     *       - Services - EMail —— 系统服务：邮件
     *     summary: 获取邮件发送账户
     *     description: 获取发送邮件时用的账户密码
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "get /account": async (ctx) => {
        let backRsl = new ApiResponse();
        const myModels = new Models();
        let settings = await myModels.SystemConfig.findAll({
            where: {
                Group: EMAIL_SETTING_GROUP
            }
        });

        backRsl.data = {};
        for (let s of settings) {
            backRsl.data[s.Name] = s.Value;
        }

        ctx.body = backRsl.getJSONString();
    },

    /**
     * @swagger
     * /services/email/inbox:
     *   get:
     *     tags:
     *       - Services - EMail —— 系统服务：邮件
     *     summary: 获取邮件默认收件地址
     *     description: 获取用于默认收件的邮箱地址，如用于kindle邮件推送
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "get /inbox": async (ctx) => {
        let backRsl = new ApiResponse();
        const myModels = new Models();
        let settings = await myModels.SystemConfig.findAll({
            where: {
                Group: KINDLE_INBOX
            }
        });

        backRsl.data = {};
        for (let s of settings) {
            backRsl.data[s.Name] = s.Value;
        }

        ctx.body = backRsl.getJSONString();
    },

    /**
     * @swagger
     * /services/email/inbox:
     *   post:
     *     tags:
     *       - Services - EMail —— 系统服务：邮件
     *     summary: 保存邮件默认收件地址
     *     description: 保存用于默认收件的邮箱地址，如用于kindle邮件推送
     *     parameters:
     *       - in: body
     *         name: account
     *         description: 用于Kindle等收件的地址
     *         schema:
     *             type: object
     *             required:
     *               - address
     *             properties:
     *               address:
     *                 type: string
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "post /inbox": async (ctx) => {
        let backRsl = new ApiResponse();
        let param = await Server.parseJsonFromBodyData(ctx, ["address"]);
        if (param == null) {
            backRsl.code = 50000;
            backRsl.msg = "参数错误。";
            ctx.body = backRsl.getJSONString();
            return;
        }


        const myModels = new Models();
        let [settings] = await myModels.SystemConfig.findOrCreate({
            where: {
                Group: KINDLE_INBOX,
                Name: "address"
            }
        });

        settings.Value = param.address;

        await settings.save().then(() => {
            //全部成功
        }).catch((err) => {
            backRsl.code = 50000;
            backRsl.msg = err.message;
        }).finally(() => {
            ctx.body = backRsl.getJSONString();
        });
    },

})