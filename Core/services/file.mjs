/**
 * 通用的文件上传、下载、列出等逻辑
 */
// const fs = require("fs");
import fs from "fs";
import path from "path";
import { Stream } from "stream";

/**
 * 列出指定路径下的文件
 * @param {string} path 需要列出文件的路径 
 * @param {string[] | null} filetype 过滤的文件规则类型/小写字母的后缀名数组
 */
export async function ListFile(path, filetype = null) {
    // console.log(fs)
    if (!fs.existsSync(path)) return null;

    let result = [];
    const dir = fs.opendirSync(path);
    for await (const dirent of dir) {
        if (!dirent.isFile()) continue;

        let isFont = false;
        if (filetype) for (let t of filetype) if (dirent.name.toLowerCase().endsWith(t)) isFont = true;
        if (isFont) result.push(dirent.name);
    }

    // console.log(result);
    return result;
}

/**
 * 在指定目录存储文件
 * @param {} file HTTP文件对象
 * @param {string} filePath 需要存储的文件目录+存储文件名
 */
export async function AddFile(file, filePath) {
    return new Promise((resolve, reject) => {
        try {
            let savePath = path.normalize(filePath);
            let dirName = path.dirname(savePath);
            if (!fs.existsSync(dirName)) fs.mkdirSync(dirName, { recursive: true });

            const writer = fs.createWriteStream(savePath);

            if (file instanceof Stream && file.readable) file.pipe(writer);     //可读流才写入，否则只会存一个空文件
            else if (file.filepath) {
                const reader = fs.createReadStream(file.filepath);
                reader.pipe(writer);
            } else {
                reject("保存文件无法处理：未知的文件来源" + filePath);
            }
            writer.on("finish", () => {
                resolve(true);
            });
        } catch (err) {
            reject(err);
        }
    })

}

/**
 * 删除指定的文件
 * @param {*} fileFullPath 需删除的文件完整路径（带文件名）
 * @returns {Promise}
 */
export async function DeleteFile(fileFullPath) {
    return new Promise((resolve, reject) => {
        fs.accessSync(fileFullPath);//不存在的时候 会抛出err

        fs.unlinkSync(fileFullPath);
        resolve(true);
    });
}