import fs from "fs";
import path from "node:path";
import Router from "@koa/router";
import EventManager from "../Core/EventManager.js";
import { ApiResponse } from "../Entity/ApiResponse.js";
import Serialize from "../Core/Utils/Serialize.js";
import { error } from "node:console";

const __dirname = import.meta.dirname;
const __filename = import.meta.filename;
const em = new EventManager();
const router = new Router();

/**
 * 路由模块装载器
 * 如 func1.js 含对应路由规则：`get /test`，映射的路由为：/func1/test
 * @param {string} dir 装载的当前目录
 * @param {string} fatherRouter 父级路由
 * @param {function} cb_loader 配置器 loader
 */
async function load(dir, fatherRouter, cb_loader) {
    // 获取dir的路径
    const fullPath = path.resolve(__dirname, dir);
    // 获取dir文件夹下的文件内容
    const files = fs.readdirSync(fullPath);  //加载指定目录
    // 遍历文件
    files.forEach(async (filename) => {
        if (__filename.endsWith(filename)) return;    //防止加载当前文件
        const { name, ext } = path.parse(filename);
        const isFloder = ext === "";

        //子目录-递归加载
        if (isFloder) return load(`${dir}/${filename}`, filename, cb_loader);
        if (!ext.endsWith('js')) return;      //不加载有后缀但不是js的文件

        const packagePath = path.join(fullPath, filename);
        import(packagePath).then(router => {
            cb_loader(name, fatherRouter, router.default);
        }).catch(error => {
            console.warn(`加载路由失败：${packagePath}\n${error.message}\n${error.stack}`);
        })
    });
}

/**
 * 路由配置器
 * @param {string} filename 加载的文件名，不要带后缀
 * @param {string} fatherRouter 父级路由（文件夹名）
 * @param {function|object} routes require之后的模块内容
 */
function loader(filename, fatherRouter, routes) {
    if (typeof (routes) === "function") //模块文件导出为function形式的处理
        routes = routes();

    if (filename === "index") filename = "";
    const prefix = routes.prefix ? path.posix.join(routes.prefix, filename) : path.posix.join('/', fatherRouter, filename);      //控制器文件名为一级路由

    Object.keys(routes).forEach(key => {
        if (key === "prefix") return; //跳过prefix字段

        const [method, rPath] = key.split(' ');
        // 注册路由
        let mType = `[${method.toUpperCase()}]`.padStart(10, " ");
        let realPath = path.posix.join(prefix, rPath)//路由地址
        em.emit("Debug.Log", `将加载路由：\t${mType}\t${(realPath).padEnd(40, " ")}\t/Controller/${fatherRouter ? fatherRouter + "/" : ""}${filename}`, "ROUTER");
        router[method.toLowerCase()](realPath, async (ctx) => {
            ctx.set('Content-Type', 'application/json');    //统一所有路由默认json返回格式

            //在最顶层捕获错误，以防出错后程序中断
            try {
                return await routes[key](ctx);
            } catch (err) {
                new ApiResponse(Serialize.Error(err), "通用接口异常捕获：" + err.message, 50000).toCTX(ctx);
            }
        });
    })
}

//加载当前文件夹下所有js结尾的文件作为控制器
load(".", "", loader)

export default router;