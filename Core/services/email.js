//发邮件 邮箱管理
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const EventManager = require("../../Core/EventManager");
const path = require('path')
const { version } = require("../../package.json");

const { EMAIL_SETTING_GROUP, KINDLE_INBOX } = require("../../Entity/SystemConfigGroup");
const SystemConfigService = require("./SystemConfig");


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

            const mySystemConfig = new SystemConfigService();

            if (mailto === "") {
                mailto =await mySystemConfig.getConfig(KINDLE_INBOX, "address");
            }
            if (sender === "") {
                sender = await mySystemConfig.getConfig(EMAIL_SETTING_GROUP, "address");
            }
            if (pass === "") {
                pass = await mySystemConfig.getConfig(EMAIL_SETTING_GROUP, "password");
            }
            
            if (sender === "" || mailto === "" || pass === "") {
                reject("默认邮箱配置不完整，不能发送邮件，请先在系统设置收/发件信息；或直接指定收/发件信息。");
                return;
            }

            //邮件属性——邮件的详细信息
            let mailOptions = {
                from: sender,
                to: mailto,
                subject: title || "Send the e-mail by default",
                text: content || "This e-mail sent by EBookWorkshop!",
                attachments: []// string[]
            };

            //添加附件-将附件按插件发送要求转换
            if (files) {        //NOTE: 这儿会有将服务器任意文件通过邮件发出去的bug，会泄露服务器信息。
                for (let f of files) {
                    let filePath = path.resolve(__dirname, "./../../", f)
                    let filename = path.basename(filePath);
                    mailOptions.attachments.push({
                        filename,
                        path: filePath      //文件完整的路径
                    });
                }
            }

            if (!title) {
                title = `${mailOptions.attachments[0].filename}等${mailOptions.attachments.length}本书`;
                mailOptions.subject = title;
            }
            if (!content) {
                content = `已发送下列书籍： \n${mailOptions.attachments.map(t => t.filename).join('\n')}`;
                mailOptions.text = content;
            }
            mailOptions.text += `\n\n---------------------------------\n——邮件发送自：EBook Workshop v${version}`;

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

module.exports = {
    SendAMail,
    EMAIL_SETTING_GROUP,
    KINDLE_INBOX,
}