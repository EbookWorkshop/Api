const Sequelize = require("sequelize");
const Models = require("./Models");
const { databasePath } = require("./../../config");
const EventManager = require("./../EventManager");
const em = new EventManager();

let myDBConnnect = null;
let myModels = null;


/**
 * 数据库
 */
class DB {
    constructor() {
        if (myDBConnnect == null) {
            this.myDbPath = null;

            myDBConnnect = DB.Connect(databasePath);
            myModels = new Models(myDBConnnect);
            em.emit("Debug.Model.Init.Finish", "DatabaseHelper");
        }
        return myDBConnnect;
    }

    /**
     * 建⽴连接
     * @returns 
     */
    static Connect(path) {
        this.myDbPath = path || databasePath;

        return new Sequelize({
            dialect: 'sqlite',
            storage: this.myDbPath,
            logging: false,
            //timezone: '+08:00',
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        });
    }
}

module.exports = DB;