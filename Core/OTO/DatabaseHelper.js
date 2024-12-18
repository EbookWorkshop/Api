const Sequelize = require("sequelize");
const Models = require("./Models");
const { databasePath } = require("./../../config").config;
const EventManager = require("./../EventManager");
const em = new EventManager();

let myDb = null;
let myModels = null;//new Models(myDb);


/**
 * 数据库
 */
class DB {
    constructor() {
        if (myDb == null) {
            myDb = DB.Connect(databasePath);
            myModels = new Models(myDb);
            em.emit("Debug.Model.Init.Finish", "DatabaseHelper");
        }
        return myDb;
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
        path = path || databasePath;
        return new Sequelize({
            dialect: 'sqlite',
            storage: path,
            logging: false,
            //timezone: '+08:00',
        });
    }



}

module.exports = DB;