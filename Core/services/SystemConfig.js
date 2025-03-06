const SYSTEM_CONFIG = require("../../Entity/SystemConfigGroup");
const Models = require("../../Core/OTO/Models");


class SystemConfigService {
    /**
     * 获取系统配置
     * @param {SYSTEM_CONFIG} Group 功能分组
     * @param {string} Name 配置名
     * @returns
     */
    static async getConfig(Group, Name) {
        try {
            let myModel = Models.GetPO();
            const config = await myModel.SystemConfig.findOne({
                where: {
                    Group,
                    Name
                }
            });
            return config ? config.Value : null;
        } catch (error) {
            console.error("Error fetching config:", error);
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
    static async setConfig(Group, Name, Value) {
        try {
            let myModel = Models.GetPO();
            let config = await myModel.SystemConfig.findOne({
                where: {
                    Group,
                    Name
                }
            });

            if (config) {
                config.Value = Value;
                await config.save();
            } else {
                config = await myModel.SystemConfig.create({
                    Group,
                    Name,
                    Value
                });
            }

            return config;
        } catch (error) {
            console.error("Error setting config:", error);
            throw error;
        }
    }

    static Group = SYSTEM_CONFIG;
}

module.exports = SystemConfigService;