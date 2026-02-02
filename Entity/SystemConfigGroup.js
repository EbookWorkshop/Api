/**
 * 系统配置分组
 * 注意：有逻辑关联的配置项应归类到同一个分组中，然后再用具体配置名称区分。
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
     * 系统默认字体
     */
    static get SYSTEM_DEFAULT_FONT() {
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

    /**
     * 阅读习惯
     */
    static get READING_HABIT() {
        return 'reading_habit';
    }
}

module.exports = SystemConfigGroup;
