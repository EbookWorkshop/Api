/**
 * 通用的文件上传、下载、列出等逻辑
 */
// const fs = require("fs");
import exp from "constants";
import fs from "fs";


/**
 * 列出指定路径下的文件
 * @param {string} path 需要列出文件的路径 
 * @param {string[] | null} filetype 过滤的文件规则类型
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
 * 
 * @param {*} file 
 */
export async function AddFile(file, filePath) {
    return new Promise((resolve, reject) => {
        try {
            // const reader = fs.createReadStream(file.path);
            const writer = fs.createWriteStream(filePath);
            file._writeStream.pipe(writer);
            resolve(true);
        } catch (err) {
            reject(err);
        }
    })

}