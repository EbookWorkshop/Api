import SystemConfigService from "./SystemConfig.js";
import { config } from "../services/config.js";
import fs from 'node:fs';
import path from 'node:path';
import { SYSTEM_DEFAULT_FONT } from "../../Entity/SystemConfigGroup.js";

const { dataPath, FOLDER } = config;
const FONT_PATH = path.join(dataPath, FOLDER.font);

/**
 * 获取默认阅读字体
 */
export async function GetDefaultReadingFont() {
    return await SystemConfigService.getConfig(SYSTEM_DEFAULT_FONT, "defaultReadingFont");
}

/**
 * 设置默认阅读字体
 * @param {*} fontName 字体名
 */
export async function SetDefaultReadingFont(fontName) {
    return await SystemConfigService.setConfig(SYSTEM_DEFAULT_FONT, "defaultReadingFont", fontName);
}

export async function GetDefaultUIFont() {
    let fontName = await SystemConfigService.getConfig(SYSTEM_DEFAULT_FONT, "defaultUIFont");
    //找到字体名，确认字体实际路径和后缀
    const files = await fs.promises.readdir(FONT_PATH);
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
export async function SetDefaultUIFont(fontName) {
    return await SystemConfigService.setConfig(SYSTEM_DEFAULT_FONT, "defaultUIFont", fontName);
}



