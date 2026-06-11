const SYSTEM_CONFIG = require("../../Entity/SystemConfigGroup");
const Models = require("../OTO/Models");

/**
 * 从数据库读写配置
 */
class SystemConfigService {
    /**
     * 获取系统配置
     * @param {SYSTEM_CONFIG} Group 功能分组
     * @param {string} Name 配置名
     * @returns
     */
    static async getConfig(Group, Name, trans) {
        try {
            let myModel = Models.GetPO();
            const config = await myModel.SystemConfig.findOne({
                where: {
                    Group,
                    Name
                },
                transaction: trans
            });
            return config ? config.Value : null;
        } catch (error) {
            console.error(`获取系统配置失败：\n功能分组：${Group}\n配置名：${Name}\n`, error);
            throw error;
        }
    }

    /**
     * 设置系统配置
     * @param {SYSTEM_CONFIG} Group 功能分组
     * @param {string} Name 配置名
     * @param {string} Value 值
     * @returns 
     */
    static async setConfig(Group, Name, Value, trans) {
        try {
            let myModel = Models.GetPO();
            let config = await myModel.SystemConfig.findOne({
                where: {
                    Group,
                    Name
                },
                transaction: trans
            });

            if (config) {
                config.Value = Value;
                await config.save({ transaction: trans });
            } else {
                config = await myModel.SystemConfig.create({
                    Group,
                    Name,
                    Value
                }, {
                    transaction: trans
                });
            }

            return config;
        } catch (error) {
            console.error(`保存系统配置失败：\n功能分组：${Group}\n配置名：${Name}\n`, error);
            throw error;
        }
    }

    /**
     * 删除系统配置
     * @param {SYSTEM_CONFIG} Group 功能分组
     * @param {string} Name 配置名
     * @param {Transaction?} trans 事务
     * @returns 
     */
    static async delConfig(Group, Name, trans) {
        try {
            let myModels = Models.GetPO();
            const value = await myModels.SystemConfig.destroy({
                where: {
                    Group,
                    Name
                },
                transaction: trans
            });

            return value;
        } catch (error) {
            console.error(`清除系统配置失败：\n功能分组：${Group}\n配置名：${Name}\n`, error);
            throw error;
        }
    }

    static Group = SYSTEM_CONFIG;
}

module.exports = SystemConfigService;