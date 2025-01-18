const { readdir } = require('node:fs/promises');
const path = require("path");
const Sequelize = require("sequelize");
const EventManager = require("../../EventManager");
const Relational = require("./Relational");


let PO_MODELS = null;//PO对象

/**
 * # PO 持久对象(Persistant Object)    
 * 每个属性对应数据库中某个表，一个表就是一个类,每张表的字段就是类中的一个属性    
 * __注意；PO中应该不包含任何对数据的操作__
 */
class Models {
    constructor(sequelizeConnect) {
        if (PO_MODELS != null) return PO_MODELS;

        PO_MODELS = this;

        AutoInit(sequelizeConnect);

        return this;
    }
    
    /**
     * # PO 持久对象(Persistant Object)    
     * 每个属性对应数据库中某个表，一个表就是一个类,每张表的字段就是类中的一个属性    
     * __注意；PO中应该不包含任何对数据的操作__
     */
    static GetPO() {
        return PO_MODELS;
    }

    /**
     * Sequelize的操作符
     * Op.and：逻辑 AND 操作符，用于组合多个条件，所有条件必须同时满足。
     * Op.or：逻辑 OR 操作符，用于组合多个条件，至少有一个条件满足即可。
     * Op.gt：大于（Greater Than）操作符，用于数值比较。
     * Op.gte：大于等于（Greater Than or Equal）操作符。
     * Op.lt：小于（Less Than）操作符。
     * Op.lte：小于等于（Less Than or Equal）操作符。
     * Op.ne：不等于（Not Equal）操作符。
     * Op.eq：等于（Equal）操作符。
     * Op.not：逻辑 NOT 操作符，用于否定某个条件。
     * Op.between：介于两个值之间（Between）操作符。
     * Op.notBetween：不介于两个值之间操作符。
     * Op.in：在给定数组中的值（In）操作符。
     * Op.notIn：不在给定数组中的值（Not In）操作符。
     * Op.like：模糊匹配（Like）操作符，用于字符串匹配。
     * Op.notLike：不模糊匹配（Not Like）操作符。
     * Op.iLike：不区分大小写的模糊匹配（ILike）操作符，仅限 PostgreSQL。
     * Op.regexp：正则表达式匹配（Regexp）操作符，仅限 MySQL/PostgreSQL。
     * Op.notRegexp：不匹配正则表达式（Not Regexp）操作符。
     * Op.iRegexp：不区分大小写的正则表达式匹配（IRegexp）操作符，仅限 PostgreSQL。
     * Op.notIRegexp：不区分大小写的不匹配正则表达式（Not IRegexp）操作符。
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
    readdir(__dirname).then(fileList => {
        // console.log(result);
        for (let file of fileList) {
            if (file === "index.js" || !file.endsWith(".js")) continue;
            const MODEL_NAME = file.replace(".js", "");
            const define = require(path.join(__dirname, file));        //按文件装模型

            PO_MODELS[MODEL_NAME] = define(sqlConnect);

        }

        Relational(PO_MODELS);

        //同步所有模型
        sqlConnect.sync().then(result => {
            em.emit("DB.Models.Init", sqlConnect.options.storage, result);
        })
    }).catch(err => {
        em.emit("Debug.Log", "数据库初始化失败！", " DATABASE", err);
    });

}



module.exports = Models;