/**
 * 管理字体 
 * 试用ESM模式，注意：ESM的模块异步加载，无状态
 */
import path from "path";
import ApiResponse from "../../Entity/ApiResponse.js"
import { ListFile, AddFile, DeleteFile } from "../../Core/services/file.mjs";
import config from "../../config.js";

const { fontPath } = config;

//获取静态资源文件
export default {
    // module.exports = {
    /**
     * @swagger
     * /services/font:
     *   get:
     *     tags:
     *       - Services - Font —— 系统服务：字体管理
     *     summary: 获得字体列表
     *     description: 取得字体文件夹的文件列表
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 请求失败
     */
    "get ": async (ctx) => {
        //传入的相对路径
        let resPath = fontPath;
        let data = await ListFile(resPath, ["ttf", "fon", "otf", "woff", "woff2", "ttc", "dfont"]);
        new ApiResponse((data ?? []).map(f => {
            return "/font/" + f;
        })).toCTX(ctx);
    },

    /**
     * @swagger
     * /services/font/add:
     *   post:
     *     tags:
     *       - Services - Font —— 系统服务：字体管理
     *     summary: 上传字体到字体目录
     *     description: 将提交的字体文件保存到字体目录
     *     consumes:
     *       - multipart/form-data
     *     parameters:
     *       - in: formData
     *         name: file
     *         type: file
     *         description: 要上传的字体文件
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "post /add": async (ctx) => {
        const file = ctx.request.files?.file; // 获取上传的文件
        if (!file) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }

        // 指定保存文件的路径
        let filePath = path.join(fontPath, file.originalFilename);

        let rsl = await AddFile(file, filePath);
        new ApiResponse(rsl).toCTX(ctx);
    },

    /**
     * @swagger
     * /services/font:
     *   delete:
     *     tags:
     *       - Services - Font —— 系统服务：字体管理
     *     summary: 删除
     *     description: 删除字库里指定的字体文件
     *     parameters:
     *     - name: fontName
     *       in: query
     *       required: true
     *       description: 将要删除字体文件名
     *       schema:
     *         type: string
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "delete ": async (ctx) => {
        let fontName = ctx.query.fontName;
        let filePath = fontPath;
        if (!fontName) return new ApiResponse(false, "请求参数错误", 60000).toCTX(ctx);

        await DeleteFile(path.join(filePath, fontName)).catch((err) => {
            new ApiResponse("删除失败", err.message, err.code === "ENOENT" ? 60000 : 50000).toCTX(ctx);
        }).then((reslut) => {
            new ApiResponse(reslut).toCTX(ctx);
        })

    },
};