/**
 * 通用的文件上传、下载、列出等逻辑
 */
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { Stream } from "stream";

/**
 * 列出指定路径下的文件
 * @param {string} sourcePath 需要列出文件的路径 
 * @param {{ filetype: string[]|null; detail: boolean; }} [options={ filetype: null, detail: false }] filetype: 需要列出的文件后缀数组（不含点号），null表示列出所有文件；detail：是否返回详细信息（包含文件大小）
 */
export async function ListFile(sourcePath, options = { filetype: null, detail: false }) {
    try {
        await fsPromises.access(sourcePath);

        let result = [];
        const dir = await fsPromises.opendir(sourcePath);
        for await (const dirent of dir) {
            if (!dirent.isFile()) continue;
            let item = {
                file: dirent.name,
                path: dirent.parentPath,
            }
            if (!options?.filetype) {
                result.push(item);
            } else {
                let { ext, name } = path.parse(dirent.name);
                item.name = name;
                ext = ext.replace(/^\./, "").toLowerCase();
                if (options?.filetype.includes(ext)) result.push(item);
            }
        }

        if (!options?.detail) return result.map(item => item.name);

        for (let item of result) {
            item.size = (await fsPromises.stat(path.join(item.path, item.file))).size;
            delete item.path;
        }

        return result;
    } catch (err) {
        return null;
    }
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
    if (!fs.existsSync(path) || !fileName) return null;

    const dir = fs.opendirSync(path);
    const lowerName = fileName.toLowerCase() + ".";//不含后缀
    for await (const dirent of dir) {
        if (!dirent.isFile()) continue;
        const { name } = dirent;//文件名，含后缀（Linux下）
        if (name.toLowerCase().startsWith(lowerName)) return dirent;
    }

    return null;
}

/** * 重命名指定的文件
 * @param {*} oldPath 旧文件完整路径
 * @param {*} newPath 新文件完整路径
 * @returns {Promise}
 */
export async function RenameFile(oldPath, newPath) {
    return fsPromises.rename(oldPath, newPath);
}