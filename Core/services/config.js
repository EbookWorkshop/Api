import fs from "node:fs";
import path from "node:path";

import EventManager from "../EventManager.js";
import defaultConfig from "../../config.js";

const UserConfigFilePath = "./UserConfig.json";
const em = new EventManager();

/**
 * 加载用户的配置文件
 * @returns 
 */
function loadUserConfig() {
    const UserConfigFile = UserConfigFilePath;
    if (!fs.existsSync(UserConfigFile)) {
        return {};
    }

    try {
        return JSON.parse(fs.readFileSync(UserConfigFile, "utf-8") || "{}");
    } catch (error) {
        em.emit("Debug.Log", "加载用户配置失败:", error.message)
        return {};
    }
}

/**
 * 保存用户的配置文件
 * @param {*} config 
 */
export function saveUserConfig(config) {
    let userConfig = loadUserConfig();

    for (const key in config) {
        if (typeof config[key] === "object") {
            userConfig[key] = Object.assign({}, userConfig[key], config[key]);
        } else if (config[key] === defaultConfig[key]) {
            delete userConfig[key];
        } else {
            userConfig[key] = config[key];
        }
    }

    fs.writeFileSync(UserConfigFilePath, JSON.stringify(userConfig, null, 4), "utf-8");
}

/**
 * 获取最新的配置文件
 * @returns 
 */
export function latestConfig() {
    const cf = Object.assign({
        "FOLDER": {
            "BookStorage": "Books",
            "BookCover": "Cover",
            "font": "font",
            "TempBookOutput": "Output",
            "TempFile": "temp",
        },
    }, defaultConfig, loadUserConfig());

    //检查用户资料库的必须目录并创建缺失部分
    let checkPath = cf.dataPath;
    if (!fs.existsSync(checkPath)) fs.mkdir(checkPath, { recursive: true }, () => { });//linux  下回调函数是必须的
    checkPath = path.join(cf.dataPath, cf.FOLDER.BookCover);
    if (!fs.existsSync(checkPath)) fs.mkdir(checkPath, { recursive: true }, () => { });
    checkPath = path.join(cf.dataPath, cf.FOLDER.BookStorage);
    if (!fs.existsSync(checkPath)) fs.mkdir(checkPath, { recursive: true }, () => { });
    checkPath = path.join(cf.dataPath, cf.FOLDER.font);
    if (!fs.existsSync(checkPath)) fs.mkdir(checkPath, { recursive: true }, () => { });
    checkPath = path.join(cf.dataPath, cf.FOLDER.TempBookOutput);
    if (!fs.existsSync(checkPath)) fs.mkdir(checkPath, { recursive: true }, () => { });
    checkPath = path.join(cf.dataPath, cf.FOLDER.TempFile);
    if (!fs.existsSync(checkPath)) fs.mkdir(checkPath, { recursive: true }, () => { });

    return cf;
}



export const config = latestConfig();
export { defaultConfig };