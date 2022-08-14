const Sequelize = require("sequelize");


let myDb = null;

class DB {
    constructor() {
        if (myDb == null) {
            myDb = this.Connect();
        }

        return myDb;
    }

    /**
     * 建⽴连接
     * @returns 
     */
    static Connect(path) {
        path = path || "./Data/library/save.db";  //TODO：数据库存储路径 -- 配置化
        return new Sequelize({
            dialect: 'sqlite',
            storage: path,
            logging: false,
            //timezone: '+08:00',
        });

    }
}



module.exports = DB;