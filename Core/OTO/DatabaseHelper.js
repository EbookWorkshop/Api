import fs from "node:fs";
import Sequelize from "sequelize";
import Models from "./Models/index.js";
import { config } from "../services/config.js";

const { databasePath, debugSwitcher } = config;

class DB {
    constructor() {
        if (!DB.instance) {
            this.myDBConnnect = DB.Connect(databasePath);
            this.myModels = new Models(this.myDBConnnect);
            // em.emit("Debug.Model.Init.Finish", "DatabaseHelper");
            DB.instance = this;
        }
    }

    static Connect(path) {
        DB.myDbPath = path || databasePath;

        return new Sequelize({
            dialect: 'sqlite',
            storage: DB.myDbPath,
            logging: debugSwitcher.database,            // console.log,//在控制台输出sql
            //Error: Setting a custom timezone is not supported by SQLite, dates are always returned as UTC. 
            //timezone: '+08:00',
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            },
            dialectOptions: {           //连接选项
                foreignKeys: true       //启用外键约束——级联删除等需要
            }
        });
    }

    /**
     * 压缩数据库
     */
    async Compress() {
        let OldSize = fs.statSync(DB.myDbPath).size;
        let result = await this.myDBConnnect.query('VACUUM;');
        let NewSize = fs.statSync(DB.myDbPath).size;

        return {
            OldSize,
            NewSize
        }
    }
}

const instance = new DB();
Object.freeze(instance);
export default instance;
