//发邮件 邮箱管理
const Server = require("./../../Core/Server");
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const EventManager = require("./../../Core/EventManager");
const path = require('path')
const ApiResponse = require("./../../Entity/ApiResponse");
const Models = require("./../../Core/OTO/Models");


let mailServerSetting = {}; //TODO: 数据库读取


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
        // service: GetServer(mailServerSetting.email),
        auth: {
            user: mailServerSetting.email,
            pass: mailServerSetting.pass
        }
    };
    if (user && pass) {
        setting.service = GetServer(user);
        setting.auth.user = user;
        setting.auth.pass = pass;
    }
    return nodemailer.createTransport(smtpTransport(setting));
}

/**
 * 发封邮件
 * @param {{ title, content, files, mailto, sender, pass }} 邮件属性
 * @param {Array} files 文件要求相对地址数组，会自动拆分成系统接口所需格式:`{filename,path}` 或者 `{filename,content,contentType:'text/plain'}`指定文件格式
 */
async function SendAMail({ title, content, files, mailto, sender, pass }) {
    return new Promise((resolve, reject) => {
        try {
            // console.log("准备发送邮件：", title, content, files)

            //邮件属性——邮件的详细信息
            var mailOptions = {
                from: sender || mailServerSetting.email,
                to: mailto || mailServerSetting.kindle_email,
                subject: title || "Send the mail by default",
                text: content || "This e-mail sent by EBookWorkshop!",
                attachments: []     //附件地址，需要绝对地址
            };

            //添加附件
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
     *     description: 可以发一封邮件，能带附件
     *     parameters:
     *       - in: body
     *         name: email
     *         description: 邮件信息
     *         schema:
     *             type: object
     *             required:
     *               - title
     *               - mailto
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
        let param = await Server.parseJsonFromBodyData(ctx, ["title", "mailto"]);
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

        const EMAIL_SETTING_GROUP = "send_email_account";
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

})