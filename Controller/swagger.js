import packJson from "../package.json" with {type: "json"};
import jsdoc from 'swagger-jsdoc';

const { version } = packJson;
const swaggerDefinition = {
  info: {
    title: 'EBook Workshop API',
    version: version.split('.').slice(0, 2).join('.'),
    description: 'EBook Workshop 的接口。统一约定：如果返回的结果是json格式的接口，<br/>`{"code":20000}`用于代表成功，`{"code":50000}`代表服务器执行失败，`{"code":60000}`代表用户引起的失败（如输入错误类型等）。',
  },
  host: 'localhost:8777',//http://localhost:8777/swagger
  basePath: '/',
  tags: [  // 排序控制
    { name: 'Library —— 图书馆' },
    { name: 'Library - WebBook —— 网文图书馆' },
    { name: 'Library - Tag —— 图书馆管理' },
    { name: 'Library - Bookmark —— 图书馆书签' },
  ]
};
const options = {
  swaggerDefinition,
  apis: ['./Controller/**/*.?(m)js'],     // micromatch 规则
};
const swaggerSpec = jsdoc(options)

const CDN = "https://cdn.jsdelivr.net/npm";
// const CDN = "https://unpkg.com";

export default {
  /**
   * @swagger
   * /swagger.json:
   *   get:
   *     tags:
   *       - Swagger
   *     summary: 通过路由获取生成的注解文件
   *     description: 通过路由获取生成的注解文件
   *     consumes:
   *       - application/json
   *     responses:
   *       200:
   *         description: 成功
  */
  "get ../swagger.json": async (ctx) => {
    ctx.body = swaggerSpec;
  },

  //等同于：
  // router.get('/swagger.json', async function (ctx) {
  //     ctx.set('Content-Type', 'application/json');
  //     ctx.body = swaggerSpec;
  // })

  "get /scalar": async (ctx) => {
    const myCDN = ctx.query.cdn ? decodeURIComponent(ctx.query.cdn) : CDN;
    ctx.set('Content-Type', 'text/html');
    ctx.body = `
<!doctype html>
<html>
  <head>
    <title>Scalar API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script id="api-reference" data-url="/swagger.json"></script>
    <script src="${myCDN}/@scalar/api-reference@latest/dist/browser/standalone.js">/*${myCDN}/@scalar/api-reference*/</script>
  </body>
</html>`;
  },

  "get /stoplight": async (ctx) => {//
    const myCDN = ctx.query.cdn ? decodeURIComponent(ctx.query.cdn) : CDN;
    ctx.set('Content-Type', 'text/html');
    ctx.body = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>Elements in HTML</title>
    <!-- Embed elements Elements via Web Component -->
    <script src="${myCDN}/@stoplight/elements/web-components.min.js"></script>
    <link rel="stylesheet" href="${myCDN}/@stoplight/elements/styles.min.css">
  </head>
  <body>

    <elements-api
      apiDescriptionUrl="/swagger.json"
      router="hash"
      layout="sidebar"
    />

  </body>
</html>`;
  },

  "get ../swagger-ui-dist": async (ctx) => {
    const myCDN = ctx.query.cdn ? decodeURIComponent(ctx.query.cdn) : CDN;
    ctx.set('Content-Type', 'text/html');
    ctx.body = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>Swagger UI Dist</title>
  </head>
  <body>
<div id="openapi-ui-container" spec-url="/swagger.json" theme="light"></div>
<script src="${myCDN}/openapi-ui-dist@latest/lib/openapi-ui.umd.js"></script>
  </body>
</html>`;
  },
};