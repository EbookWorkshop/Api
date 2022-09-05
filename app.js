// const swagger = require('./Controller/swagger.js')
const system = require("./Core/System");
const router = require('./Controller/router')
const Koa = require('koa');
const static = require('koa-static');
const app = new Koa();
//swagger-文档中间件
const { koaSwagger } = require('koa2-swagger-ui');
app.use(koaSwagger({
    routePrefix: '/swagger', // api文档访问地址
    swaggerOptions: {
        url: '/swagger.json', // example path to json
    }
}));

//设置跨域
app.use(async (ctx, next) => {
    ctx.set("Access-Control-Allow-Origin", "*");
    ctx.set("Access-Control-Allow-Methods", "OPTIONS, GET, PUT, POST, DELETE");
    ctx.set("Access-Control-Allow-Headers", "Content-Type,Access-Token,Authorization,Accept,Origin,X-Requested-With,Accept-Language,Content-Language");
    ctx.set("Access-Control-Allow-Credentials", true);
    if (ctx.request.method === 'OPTIONS') { // 直接响应数据 应对axios的跨域探测
        ctx.status = 200;
    }
    await next();
});

//注册路由
app.use(router.routes());
//启动静态文件服务
app.use(static("./Data"))

system.then(() => {
    console.log("开始监听：8777");
    app.listen(8777);
});

