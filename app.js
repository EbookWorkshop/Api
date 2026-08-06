ShowLogo();
const Koa = require('koa');
const static = require('koa-static');
const { koaBody } = require('koa-body');
const { koaSwagger } = require('koa2-swagger-ui');
const path = require("node:path");
const { config: myConfig } = require("./Core/services/config");
const Serialize = require("./Core/Utils/Serialize");
const system = require("./Core/System");
const router = require('./Controller/router');
const EventManager = require("./Core/EventManager");
const ApiResponse = require("./Entity/ApiResponse");

const app = new Koa();

// 使用koa-body中间件解析请求体
app.use(koaBody({
    multipart: true,        //解释多个文件
    formLimit: '50mb',
    jsonLimit: '50mb',
    textLimit: '50mb',
}));

//swagger-文档中间件
app.use(koaSwagger({
    routePrefix: '/swagger', // api文档访问地址
    swaggerOptions: {
        url: '/swagger.json', // example path to json
    }
}));

//在Koa框架中，app.on("error")主要用于日志记录，而不会改变HTTP响应。
app.on("error", (err, ctx) => {
    let em = new EventManager();
    err = Serialize.Error(err);
    em.emit("Debug.Log", err?.message || err, "KOAERR", err);
});


app.use(async (ctx, next) => {
    try {
        CtxSetAllowHead(ctx);//设置跨域
        await next();
    } catch (err) {// 全局错误处理中间件
        new ApiResponse(err, err?.message || String(err), 50000).toCTX(ctx);
    }
});

//注册路由
app.use(router.routes());
//启动静态文件服务
let filePath = path.join(myConfig.dataPath, "");
app.use(static(filePath));

//app.use(Router.allowedMethods()); TODO: 推荐的处理错误请求方式

system.then((service) => {
    console.log(`[${new Date().toLocaleString()}]\t开始监听：8777`);
    let server = app.listen(8777);
    new service.io(server);
    service.next();
}).catch((error) => {
    console.warn(`[${new Date().toLocaleString()}]\t系统启动失败:`);
    console.error(error);
});


/**
 * 统一设置的上下文，解决跨域拦截
 * @param {*} ctx 
 */
function CtxSetAllowHead(ctx) {
    ctx.set("Access-Control-Allow-Origin", "*");
    ctx.set("Access-Control-Allow-Methods", "OPTIONS, GET, PUT, POST, DELETE, PATCH");
    ctx.set("Access-Control-Allow-Headers", "Content-Type,Access-Token,Authorization,Accept,Origin,X-Requested-With,Accept-Language,Content-Language");
    ctx.set("Access-Control-Allow-Credentials", true);
    if (ctx.request.method === 'OPTIONS') { // 直接响应数据 应对axios的跨域探测
        ctx.status = 200;
    }
}

function ShowLogo() {
    console.log(`
██████ ██████  █████  █████ █   █         █    █  █████ ██████ █   █   █████ █    █  █████ ██████
█      █    █ █    █ █    █ █  █          █    █ █    █ █    █ █  █   █      █    █ █    █ █    █
█████  ██████ █    █ █    █ ███           █ ██ █ █    █ ██████ ███     █████ ██████ █    █ ██████
█      █    █ █    █ █    █ █  █          ██  ██ █    █ █   █  █  █        █ █    █ █    █ █     
██████ ██████  █████  █████ █   █         █    █  █████ █    █ █   █  █████  █    █  █████ █     `)
}