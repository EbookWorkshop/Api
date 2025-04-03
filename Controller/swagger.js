const { version } = require("./../package.json");
const jsdoc = require('swagger-jsdoc')

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

const CDN = "https://s4.zstatic.net/npm";//国内自动缓存国外CDN的一个CDN服务https://www.zstatic.net/docs/getting-started.html

module.exports = () => ({
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

    "get /scalar":async (ctx)=>{
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
    <script
      id="api-reference"
      data-url="/swagger.json"></script>
    <script src="${CDN}/@scalar/api-reference@latest/dist/browser/standalone.js">/*${CDN}/@scalar/api-reference*/</script>
  </body>
</html>`;
    },

    "get /stoplight":async (ctx)=>{//
        ctx.set('Content-Type', 'text/html');
        ctx.body = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>Elements in HTML</title>
    <!-- Embed elements Elements via Web Component -->
    <script src="${CDN}/@stoplight/elements/web-components.min.js"></script>
    <link rel="stylesheet" href="${CDN}/@stoplight/elements/styles.min.css">
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

    "get ../swagger-ui-dist":async (ctx)=>{
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
<script src="${CDN}/openapi-ui-dist@latest/lib/openapi-ui.umd.js"></script>

  </body>
</html>`;
    },
});


/** DEMO
 * @ swagger
 * /system_manager/add:
 *    post:
 *      tags:
 *      - system_manager
 *      summary: 新增管理员信息
 *      consumes:
 *        - application/json
 *      parameters:
 *      - name: system_manager
 *        in: body
 *        description: 新增管理员信息
 *        schema:
 *          type: object
 *          required:
 *            - id
 *            - account
 *            - token
 *          properties:
 *            obj:
 *              type: object
 *              required:
 *                - account
 *                - name
 *                - phone
 *                - roleId
 *                - state
 *              description: 新增数据对象
 *              properties:
 *                name:
 *                  type: string
 *                  description: 管理员姓名  
 *                account:
 *                  type: string
 *                  description: 管理员账号
 *                state:
 *                  type: integer
 *                  description: 账号状态    
 *                phone:
 *                  type: string
 *                  description: 管理员联系方式   
 *                roleId:
 *                  type: integer
 *                  description: 管理员角色编码      
 *            account:
 *              type: string
 *              description: 当前登录用户账号
 *            token:
 *              type: string
 *              description: 当前登录用户Token
 *      responses:
 *        200:
 *          description: successful operation
 * */
