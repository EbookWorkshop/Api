import * as SYSTEM_CONFIG from "../../Entity/SystemConfigGroup.js";
import Models from "../OTO/Models/index.js";

/**
 * 从数据库读写配置
 */
export default class SystemConfigService {
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
                attributes: ['Value'],        // 🔥 只查询 Value 字段，减少网络传输和回表开销
                raw: true,                    // 🔥 直接返回 JSON 对象，跳过 Model 实例化（更快）
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
            //INSERT ... ON DUPLICATE KEY UPDATE 语法（Sequelize 封装为 upsert 方法）
            //upsert 就是 Update + Insert 的合并原子操作，当数据存在时就更新，不存在则创建
            const [config, created] = await myModel.SystemConfig.upsert({
                Group,
                Name,
                Value
            }, {
                transaction: trans,
            });
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
                    ...(Group ? { Group } : {}),
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