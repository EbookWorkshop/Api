const Models = require("../OTO/Models");
const { DEFAULT_FONT: SYSTEM_DEFAULT_FONT } = require("../../Entity/SystemConfigGroup");
const SystemConfigService = require("./SystemConfig");

/**
 * 获取默认字体
 */
async function GetDefaultFont() {
    return await SystemConfigService.getConfig(SYSTEM_DEFAULT_FONT, "defaultfont");
}

/**
 * 设置默认字体
 * @param {*} fontName 字体名
 */
async function SetDefaultFont(fontName) {
    return await SystemConfigService.setConfig(SYSTEM_DEFAULT_FONT, "defaultfont", fontName);
}

module.exports = {
    GetDefaultFont,
    SetDefaultFont,
    SYSTEM_DEFAULT_FONT,
}