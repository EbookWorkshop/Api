/**
 * 发给前端的消息
 */
class Message {
    constructor(content, type = "notice", { title, subTitle, avatar, time, status, id } = {}) {
        this.id = id || Math.floor(Math.random() * 1000000);

        /**
         * "message" | "notice" | "todo"; //对应：通知、消息、待办
         */
        this.type = type;

        /**
         * 消息标题
         */
        this.title = title;

        /**
         * 子标题
         */
        this.subTitle = subTitle;

        /**
         * 消息头像图标
         */
        this.avatar = avatar || "logo.svg?msg_logo_mark=1";

        /**
         * 消息正文
         */
        this.content = content;
        this.time = time || new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false // 使用24小时制
        });

        /**
         * 消息状态：0未读、1已读
         */
        this.status = status || 0;

        /**
         * 消息状态(未开始、已开通、进行中、即将到期)
         * 未开发完成
         */
        this.messageType;
    }
}

module.exports = Message;