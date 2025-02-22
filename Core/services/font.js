const Models = require("./../../Core/OTO/Models");


const SYSTEM_DEFAULT_FONT = "system_default_font";       //系统设置-默认字体

/**
 * 获取默认字体
 */
async function GetDefaultFont() {
    const myModels = new Models();
    let setting = await myModels.SystemConfig.findOne({
        attributes: ["Value"],
        where: {
            Name: "defaultfont",
            Group: SYSTEM_DEFAULT_FONT
        }
    });

    return setting?.Value;
}

/**
 * 设置默认字体
 * @param {*} fontName 字体名
 */
async function SetDefaultFont(fontName) {
    const myModels = new Models();
    let [settings] = await myModels.SystemConfig.findOrCreate({
        where: {
            Group: SYSTEM_DEFAULT_FONT,
            Name: "defaultfont",
        },
        defaults: {
            Value: fontName
        }
    });

    return settings;
}

module.exports = {
    GetDefaultFont,
    SetDefaultFont,
    SYSTEM_DEFAULT_FONT,
}