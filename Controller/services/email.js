//发邮件 邮箱管理
const BookMaker = require("./../../Core/Book/BookMaker");
const PDFMaker = require("./../../Core/PDF/PDFMaker.js");
const { parseJsonFromBodyData } = require("./../../Core/Server");
const ApiResponse = require("./../../Entity/ApiResponse");
const Models = require("./../../Core/OTO/Models");
const { SendAMail, EMAIL_SETTING_GROUP, KINDLE_INBOX } = require("./../../Core/services/email");
const path = require("path");
const { dataPath } = require("./../../config");



module.exports = () => ({
    /**
     * @swagger
     * /services/email/send:
     *   post:
     *     tags:
     *       - Services - EMail —— 系统服务：邮件
     *     summary: 通过简易的SMTP服务发送邮件
     *     description: 可以发一封邮件，能带附件，如果没有发件人/收件人信息，则默认从系统配置里读取
     *     consumes:
     *       - multipart/form-data
     *     parameters:
     *       - in: formData
     *         name: mailto
     *         type: string
     *         description: 收件人邮箱地址
     *       - in: formData
     *         name: sender
     *         type: string
     *         description: 发件人邮箱地址
     *       - in: formData
     *         name: bookFiles
     *         type: array
     *         items:
     *           type: file
     *         description: 附件文件列表
     *       - in: formData
     *         name: bookList
     *         type: string
     *         description: 书籍列表，JSON字符串格式
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "post /send": async (ctx) => {
        let param = await parseJsonFromBodyData(ctx);
        if (param == null) return;

        try {
            // let email = { ...param };
            let { mailto, sender, bookFiles, bookList } = param;
            let email = { mailto, sender, files: [] };

            if (bookFiles) {
                const { AddFile } = await import("./../../Core/services/file.mjs");
                await Promise.all(bookFiles.map(file => {
                    let filePath = path.join(dataPath, "temp", "email", file.originalFilename);
                    AddFile(file, filePath);
                    email.files.push(filePath)
                }));
            }
            if (bookList) bookList = JSON.parse(bookList);
            if (bookList && bookList.length > 0) {
                const rsl = await Promise.all(bookList.map(bookSetting => {
                    let booking;
                    switch (bookSetting.filetype) {
                        case "pdf":
                            booking = PDFMaker.MakePdfFile(bookSetting.bookid);
                            break;
                        case "txt":
                            booking = BookMaker.MakeTxtFile(bookSetting.bookid);
                            break;
                        case "epub":
                            break;
                    }
                    return booking;
                }));

                email.files.push(...rsl.map(t => t.path));
            }

            if (email.files.length == 0) {
                new ApiResponse(null, "发送邮件取消：没有可用于发送的书籍/附件，取消发邮件。", 50000).toCTX(ctx);
                return
            }

            await SendAMail(email).then(result => {
                new ApiResponse().toCTX(ctx);
            }).catch((err) => {
                new ApiResponse(null, err.message || err, 50000).toCTX(ctx);
            });
        } catch (err) {
            new ApiResponse(null, err.message || err, 50000).toCTX(ctx);
        }
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
        // let backRsl = new ApiResponse();
        let param = await parseJsonFromBodyData(ctx, ["address", "password"]);
        if (param == null) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }

        const myModels = new Models();
        await myModels.SystemConfig.destroy({
            where: {
                Group: EMAIL_SETTING_GROUP
            }
        });

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
            new ApiResponse().toCTX(ctx);
        }).catch((err) => {
            new ApiResponse(null, err.message, 50000).toCTX(ctx);
        })
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
        const myModels = new Models();
        let settings = await myModels.SystemConfig.findAll({
            where: {
                Group: EMAIL_SETTING_GROUP
            }
        });

        let data = {};
        for (let s of settings) {
            data[s.Name] = s.Value;
        }

        new ApiResponse(data).toCTX(ctx);
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
        const myModels = new Models();
        let settings = await myModels.SystemConfig.findAll({
            where: {
                Group: KINDLE_INBOX
            }
        });
        let data = {};
        for (let s of settings) {
            data[s.Name] = s.Value;
        }

        new ApiResponse(data).toCTX(ctx);
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
        let param = await parseJsonFromBodyData(ctx, ["address"]);
        if (param == null) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }


        const myModels = new Models();
        let [settings] = await myModels.SystemConfig.findOrCreate({
            where: {
                Group: KINDLE_INBOX,
                Name: "address"
            },
            defaults: {
                Value: param.address
            }
        });

        settings.Value = param.address;

        await settings.save().then(() => {
            //全部成功
            new ApiResponse().toCTX(ctx);
        }).catch((err) => {
            new ApiResponse(null, err.message, 50000).toCTX(ctx);
        });
    },

})