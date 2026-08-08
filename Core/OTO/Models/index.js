import { readdir } from 'node:fs/promises';
import path from "node:path";
import Sequelize from "sequelize";
import EventManager from "../../EventManager.js";
import Relational from "./Relational/index.js";
import Serialize from "../../Utils/Serialize.js";

const __dirname = import.meta.dirname;
let PO_MODELS = null;//PO对象

/**
 * # PO 持久对象(Persistant Object)    
 * 每个属性对应数据库中某个表，一个表就是一个类,每张表的字段就是类中的一个属性    
 * __注意；PO中应该不包含任何对数据的操作__
 */
export default class Models {
    constructor(sequelizeConnect) {
        if (PO_MODELS != null) return PO_MODELS;

        PO_MODELS = this;
        this.sequelize = sequelizeConnect;

        AutoInit(sequelizeConnect);

        return this;
    }

    /**
     * 开启事务
     * @param {*} sqlConnect 数据库链接
     */
    async BeginTrans() {
        return await this.sequelize.transaction();
    }

    /**
     * # PO 持久对象(Persistant Object)    
     * 每个属性对应数据库中某个表，一个表就是一个类,每张表的字段就是类中的一个属性    
     * __注意；PO中应该不包含任何对数据的操作__
     * @returns {Models} PO对象
     */
    static GetPO() {
        return PO_MODELS;
    }

    /**
     * # Sequelize的操作符（仅保留SQLite能用部分）
     * + Op.all：用于 ALL 子查询，表示所有值都满足条件。
     * + Op.and：逻辑与，多个条件同时成立；SQL 生成 AND。
     * + Op.between：范围查询，语法 [a, b]；SQL 生成 BETWEEN a AND b。
     * + Op.endsWith：字符串结尾匹配；SQL 生成 LIKE '%x'。
     * + Op.eq：等于；SQL 生成 =。
     * + Op.gt：大于；SQL 生成 >。
     * + Op.gte：大于等于；SQL 生成 >=。
     * + Op.in：集合包含；SQL 生成 IN (...)。
     * + Op.is：精确判断 NULL/TRUE/FALSE 等；SQL 生成 IS NULL/IS TRUE。
     * + Op.like：模糊匹配；SQL 生成 LIKE。
     * + Op.lt：小于；SQL 生成 <。
     * + Op.lte：小于等于；SQL 生成 <=。
     * + Op.ne：不等于；SQL 生成 <> 或 !=。
     * + Op.not：逻辑非；SQL 生成 NOT (...)。
     * + Op.notBetween：不在范围内；SQL 生成 NOT BETWEEN。
     * + Op.notIn：不在集合中；SQL 生成 NOT IN (...)。
     * + Op.notLike：非模糊匹配；SQL 生成 NOT LIKE。
     * + Op.or：逻辑或；SQL 生成 OR。
     * + Op.startsWith：字符串前缀匹配；SQL 生成 LIKE 'x%'.
     * + Op.substring：子串匹配；SQL 生成 LIKE '%x%'.
     * + Op.values：用于多值比较；SQL 生成如 VALUES (4), (5), (6)。
     */
    static get Op() {
        return Sequelize.Op;
    }
}


/**
 * 自动加载/加载当前文件夹里的*.js文件
 * @param {*} sqlConnect 数据库链接
 */
function AutoInit(sqlConnect) {
    const em = new EventManager();
    readdir(__dirname).then(async fileList => {
        for (let file of fileList) {
            if (file === "index.js" || !file.endsWith(".js")) continue;
            const MODEL_NAME = file.replace(".js", "");
            const { default: define } = await import(path.join(__dirname, file));        //按文件装模型

            PO_MODELS[MODEL_NAME] = define(sqlConnect);
        }

        Relational(PO_MODELS);

        //同步所有模型
        console.log(`[${new Date().toLocaleString()}]\t正在初始化数据库......`);
        // sqlConnect.queryInterface.sequelize.query("");
        sqlConnect.sync(/*{ alter: true }*/).then(result => {//result 是个大对象，不要发出去
            em.emit("DB.Models.Init");
        }).catch(err => {
            em.emit("Debug.Log", "数据库同步失败！", "DATABASE", Serialize.Error(err));
        })
    }).catch(err => {
        em.emit("Debug.Log", "数据库初始化失败！", "DATABASE", Serialize.Error(err));
    });

}


