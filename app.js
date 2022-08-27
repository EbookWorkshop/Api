// const swagger = require('./Controller/swagger.js')
const system = require("./Core/System");
const router = require('./Controller/router')
const Koa = require('koa');
const app = new Koa();

//swagger-文档中间件
const { koaSwagger } = require('koa2-swagger-ui');
app.use(koaSwagger({
    routePrefix: '/swagger', // api文档访问地址
    swaggerOptions: {
        url: '/swagger.json', // example path to json
    }
}));

//注册路由
app.use(router.routes());

system.then(() => {
    console.log("开始监听：8777");
    app.listen(8777);
});

