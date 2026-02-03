const { SYSTEM_DEFAULT_FONT } = require("../../Entity/SystemConfigGroup");
const SystemConfigService = require("./SystemConfig");
const { fontPath } = require("../../config");
const fs = require('fs');
const path = require('path');

/**
 * 获取默认阅读字体
 */
async function GetDefaultReadingFont() {
    return await SystemConfigService.getConfig(SYSTEM_DEFAULT_FONT, "defaultReadingFont");
}

/**
 * 设置默认阅读字体
 * @param {*} fontName 字体名
 */
async function SetDefaultReadingFont(fontName) {
    return await SystemConfigService.setConfig(SYSTEM_DEFAULT_FONT, "defaultReadingFont", fontName);
}

async function GetDefaultUIFont() {
    let fontName = await SystemConfigService.getConfig(SYSTEM_DEFAULT_FONT, "defaultUIFont");
    //找到字体名，确认字体实际路径和后缀
    const files = await fs.promises.readdir(fontPath);
    let url = "";
    for (let file of files) {
        let { name, ext } = path.parse(file);
        if (name === fontName) {
            url = `/font/${fontName}${ext}`;
            break;
        }
    }

    return {
        name: fontName,
        url: url,
    }
}

/**
 * 设置默认UI字体
 * @param {*} fontName 字体名
 */
async function SetDefaultUIFont(fontName) {
    return await SystemConfigService.setConfig(SYSTEM_DEFAULT_FONT, "defaultUIFont", fontName);
}


module.exports = {
    GetDefaultReadingFont,
    SetDefaultReadingFont,
    GetDefaultUIFont,
    SetDefaultUIFont,
    SYSTEM_DEFAULT_FONT,
}