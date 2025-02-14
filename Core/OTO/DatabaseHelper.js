const Sequelize = require("sequelize");
const Models = require("./Models");
const { databasePath } = require("./../../config");
// const EventManager = require("./../EventManager");
// const em = new EventManager();

class DB {
    constructor() {
        if (!DB.instance) {
            this.myDbPath = null;
            this.myDBConnnect = DB.Connect(databasePath);
            this.myModels = new Models(this.myDBConnnect);
            // em.emit("Debug.Model.Init.Finish", "DatabaseHelper");
            DB.instance = this;
        }
        return DB.instance;
    }

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

const instance = new DB();
Object.freeze(instance);

module.exports = instance;