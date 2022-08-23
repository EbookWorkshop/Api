const Sequelize = require("sequelize");
const Models = require("./Models.js");

let myDb = null;
let myModels = null;//new Models(myDb);

/**
 * 数据库
 */
class DB {
    constructor() {
        if (myDb == null) {
            myDb = DB.Connect();
            myModels = new Models(myDb);
        }

    }
    static GetDB() {
        return myDb;
    }
    static Models() {
        return myModels;
    }

    /**
     * 建⽴连接
     * @returns 
     */
    static Connect(path) {
        path = path || "./Data/library/save.sqlite";  //TODO：数据库存储路径 -- 配置化
        return new Sequelize({
            dialect: 'sqlite',
            storage: path,
            logging: false,
            //timezone: '+08:00',
        });
    }



}

module.exports = DB;