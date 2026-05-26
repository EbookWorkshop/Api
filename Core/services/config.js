const defaultConfig = require('./../../config');
const EventManager = require("./../EventManager");
const fs = require("fs");

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
function saveUserConfig(config) {
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
function latestConfig() {
    return Object.assign({
        "FOLDER": {
            "BookStorage": "Books",
            "BookCover": "Cover",
            "font": "font",
            "TempBookOutput": "Output",
        },
    }, defaultConfig, loadUserConfig());
}



module.exports = {
    defaultConfig,
    /**
     * 配置文件——注意有缓存
     */
    config: latestConfig(),
    latestConfig,
    saveUserConfig,
}
