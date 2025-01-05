// export interface MessageRecord {
//     id: number;
//     type: "message" | "notice" | "todo"; //对应：通知、消息、待办
//     title: string;
//     subTitle: string;
//     avatar?: string;
//     content: string;
//     time: string;
//     status: 0 | 1;
//     messageType?: number; // 在src\components\message-box\list.vue::template::#extra 中使用(未开始、已开通、进行中、即将到期)
//   }

class Message {
    constructor(content, type = "notice", { title, subTitle, avatar, time } = {}) {
        this.id = 0;

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
        this.avatar = avatar || "/src/assets/logo.svg?msg_logo_mark=1";

        /**
         * 消息正文
         */
        this.content = content;
        this.time = time || new Date().toString();

        /**
         * 消息状态：0未读、1已读
         */
        this.status;

        /**
         * 消息状态(未开始、已开通、进行中、即将到期)
         * 未开发完成
         */
        this.messageType;
    }
}

module.exports = Message;