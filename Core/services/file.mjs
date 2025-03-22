/**
 * 通用的文件上传、下载、列出等逻辑
 */
// const fs = require("fs");
import fs from "fs";
import path from "path";
import { Stream } from "stream";

/**
 * 列出指定路径下的文件
 * @param {string} sourcePath 需要列出文件的路径 
 * @param {string[] | null} filetype 过滤的文件规则类型:小写字母的后缀名数组
 */
export async function ListFile(sourcePath, filetype = null) {
    // console.log(fs)
    if (!fs.existsSync(sourcePath)) return null;

    let result = [];
    const dir = fs.opendirSync(sourcePath);
    for await (const dirent of dir) {
        if (!dirent.isFile()) continue;
        if (filetype == null) {
            result.push(dirent.name);
        } else {
            let { ext } = path.parse(dirent.name);
            ext = ext.replace(/^\./, "").toLowerCase();
            if (filetype.includes(ext)) result.push(dirent.name);
        }
    }
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

/**
 * 找到指定文件——后缀未提供，也未知
 * @param {*} path 文件所在目录
 * @param {*} fileName 文件
 * @returns {Dirent|null} 返回文件的Dirent对象
 */
export async function FindFile(path, fileName) {
    if (!fs.existsSync(path)) return null;

    const dir = fs.opendirSync(path);
    const lowerName = fileName.toLowerCase() + ".";
    for await (const dirent of dir) {
        if (!dirent.isFile()) continue;
        const { name } = dirent;
        if (name.toLowerCase() === lowerName) return dirent;
    }

    return null;
}