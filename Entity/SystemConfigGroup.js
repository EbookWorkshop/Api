/**
 * 系统配置分组
 */
class SystemConfigGroup {
    /**
     * 邮箱的配置分组
     */
    static get EMAIL_SETTING_GROUP() {
        return 'send_email_account';
    }

    /**
     * 收件箱-可用于kindle的收件箱
     */
    static get KINDLE_INBOX() {
        return 'kindle_inbox';
    }

    /**
     * 默认字体
     */
    static get DEFAULT_FONT() {
        return 'system_default_font';
    }

    /**
     * 数据库版本相关
     */
    static get DATABASE_VERSION() {
        return 'database_version';
    }

    /**
     * 获取网站的超时设置
     */
    static get WEBSITE_TIMEOUT() {
        return 'website_timeout';
    }
}

module.exports = SystemConfigGroup;
