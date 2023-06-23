/**
 * 管理字体 
 * 试用ESM模式，注意：ESM的模块异步加载，无状态
 */
import ApiResponse from "../../Entity/ApiResponse.js"
import { ListFile } from "../../Core/services/file.mjs";

// const ApiResponse = require("../../Entity/ApiResponse");


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
        let resPath = "./Data/" + "font";
        let data = await ListFile(resPath, ["ttf", "fon"]);
        let result = new ApiResponse((data ?? []).map(f => {
            return "/font/" + f;
        }));
        ctx.body = result.getJSONString();
    },
};