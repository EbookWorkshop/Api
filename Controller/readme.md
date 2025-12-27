# EbookWorkshop 路由开发说明文档

## 1. 路由系统概述

EbookWorkshop 使用 **Koa Router** 作为路由框架，通过自动加载机制简化路由管理。系统会自动扫描 `Controller` 目录下的所有 JavaScript 文件，并根据文件路径和内部配置生成相应的 API 路由。

### 1.1 核心特性

- ✅ **自动路由加载**：无需手动注册路由，系统自动扫描并加载
- ✅ **支持 CJS 和 ESM**：同时支持 CommonJS [^1]和 ES Module 模块格式[^2]
- ✅ **Swagger 文档集成**：通过 JSDoc 注释自动生成 API 文档
- ✅ **统一错误处理**：全局捕获路由异常，确保程序稳定运行
- ✅ **统一响应格式**：所有 API 默认返回 JSON 格式，使用 `ApiResponse` 标准化响应
- ✅ **目录结构映射**：路由路径与文件目录结构自动映射

## 2. 路由模块开发

### 2.1 基本结构

每个路由模块是一个 JavaScript 文件，导出一个函数，该函数返回一个包含路由配置的对象。

**示例**：
```javascript
// Controller/assets.js
module.exports = () => ({
    "get /download/:path": async (ctx) => {
        // 路由处理逻辑
    },
});
```

### 2.2 路由定义格式

路由定义采用字符串键值对形式，键为 `HTTP方法 路由路径`，值为处理函数。

**语法**：
```javascript
"[HTTP方法] [路由路径]": async (ctx) => {
    // 处理逻辑
}
```

**示例**：
```javascript
"get /booklist": async (ctx) => { /* GET 请求处理 */ },
"post /book": async (ctx) => { /* POST 请求处理 */ },
"delete /book/:id": async (ctx) => { /* DELETE 请求处理 */ },
"patch /book/metadata": async (ctx) => { /* PATCH 请求处理 */ },
```

### 2.3 路由路径生成规则

路由的完整路径由三部分组成：
`/[父目录名]/[文件名]/[路由定义中的路径]`
或：
`[自定义前缀]/[文件名]/[路由定义中的路径]`（如果在模块中定义了 `prefix` 属性，见[5.1 自定义前缀](#51-自定义前缀)）

**示例**：
- 文件：`Controller/library/index.js`
- 路由定义：`"get /booklist"`
- 完整路径：`/library/index/booklist`


### 2.4 路由处理函数

处理函数接收一个 Koa 上下文对象 `ctx`，可以通过该对象访问请求参数、响应对象等。

**常用属性和方法**：
- `ctx.query`：获取 URL 查询参数
- `ctx.params`：获取路径参数
- `ctx.request.body`：获取请求体数据
- `ctx.body`：设置响应体
- `ctx.set()`：设置响应头

## 3. API 响应规范

### 3.1 统一响应格式

所有 API 应使用 `ApiResponse` 类返回标准化的 JSON 响应：

```javascript
const ApiResponse = require("./../Entity/ApiResponse");

// 成功响应
new ApiResponse(data).toCTX(ctx);

// 带消息的成功响应
new ApiResponse(data, "操作成功").toCTX(ctx);

// 错误响应
new ApiResponse(null, "操作失败", 50000).toCTX(ctx);
```

### 3.2 响应结构

```json
{
  "data": {},          // 响应数据
  "msg": "成功",       // 响应消息
  "code": 20000        // 响应码（20000表示成功）
}
```

### 3.3 响应码规范

- `20000`：成功
- `50000`：服务器内部错误
- `60000`：参数错误

## 4. Swagger 文档

### 4.1 文档生成

系统通过解析路由模块中的 JSDoc 注释自动生成 Swagger 文档。文档访问地址：`http://localhost:8777/swagger`

### 4.2 注释规范

为路由添加 Swagger 注释示例：

```javascript
/**
 * @swagger
 * /library/booklist:
 *   get:
 *     tags:
 *       - Library —— 图书馆
 *     summary: 拿到所有书的信息
 *     description: 拿到所有书的信息
 *     parameters:
 *     - name: tagid
 *       in: query
 *       required: false
 *       description: 标签ID
 *       schema:
 *         type: integer
 *         format: int64
 *     responses:
 *       200:
 *         description: 请求成功
 *       500:
 *         description: 请求失败
 */
"get /booklist": async (ctx) => {
    // 处理逻辑
},
```

### 4.3 注释字段说明

- `@swagger`：标记为 Swagger 文档
- `/library/booklist`：API 路径
- `get`：HTTP 方法
- `tags`：API 分类标签
- `summary`：API 简短描述
- `description`：API 详细描述
- `parameters`：请求参数
- `responses`：响应定义

## 5. 高级特性

### 5.1 自定义前缀

路由模块可以通过 `prefix` 属性自定义路由前缀：

```javascript
module.exports = () => ({
    prefix: "/api",  // 自定义前缀
    "get /test": async (ctx) => {
        // 完整路径：/api/[文件名]/test
    },
});
```

### 5.2 处理文件上传

使用 `koa-body` 中间件处理文件上传：

```javascript
"patch /book/metadata": async (ctx) => {
    let bookInfo = await parseJsonFromBodyData(ctx, ["id"]);
    if (!bookInfo) return;
    
    // 处理上传的文件
    if (bookInfo.coverFile) {
        // bookInfo.coverFile[0] 为上传的文件对象
    }
},
```

### 5.3 错误处理

系统会在顶层捕获所有路由异常，但也可以在路由内部进行精细的错误处理：

```javascript
"delete /book": async (ctx) => {
    try {
        const bookId = ctx.query.bookid;
        // 验证参数
        if (bookId * 1 != bookId) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }
        // 业务逻辑
        let result = await DO.DeleteOneBook(bookId);
        new ApiResponse(result).toCTX(ctx);
    } catch (err) {
        new ApiResponse(null, "删除出错：" + err.message, 50000).toCTX(ctx);
    }
},
```

## 6. 路由模块示例

### 6.1 简单路由模块

**示例**：`Controller/assets.js`
```javascript
const send = require('koa-send');
const { dataPath } = require("./../config");
const path = require("path");

module.exports = () => ({
    /**
     * @swagger
     * /assets/download/{path}:
     *   get:
     *     tags:
     *       - Assets —— 资源管理
     *     summary: 下载文件
     *     description: 下载静态资源
     *     parameters:
     *     - name: path
     *       in: path
     *       required: true
     *       description: 资源路径
     *       schema:
     *         type: string
     *     responses:
     *       200:
     *         description: 请求成功
     */
    "get /download/:path": async (ctx) => {
        let resPath = path.join(dataPath, ctx.params.path);
        ctx.attachment(resPath);
        await send(ctx, ctx.params.path, { root: dataPath });
    },
});
```

### 6.2 复杂路由模块

**示例**：`Controller/library/index.js`（部分）
```javascript
const DO = require("../../Core/OTO/DO");
const ApiResponse = require("./../../Entity/ApiResponse");
const { parseJsonFromBodyData } = require("./../../Core/Server");

module.exports = () => ({
    /**
     * @swagger
     * /library/booklist:
     *   get:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 拿到所有书的信息
     *     description: 拿到所有书的信息
     *     parameters:
     *     - name: tagid
     *       in: query
     *       required: false
     *       description: 标签ID
     *       schema:
     *         type: integer
     *         format: int64
     *     responses:
     *       200:
     *         description: 请求成功
     */
    "get /booklist": async (ctx) => {
        let tagid = ctx.query.tagid * 1;
        let nottag = ctx.query.nottag;
        // 处理nottag参数
        if (nottag?.length > 0 && nottag?.split(",").length > 0) {
            nottag = nottag.split(",").map((item) => item * 1);
        }
        // 获取数据并响应
        new ApiResponse(await DO.GetBookList(tagid, nottag)).toCTX(ctx);
    },
    
    // 更多路由...
});
```

### 6.3 ESM方式路由模块

**示例**：`Controller/services/font.mjs`（部分）
```javascript
import path from "path";
import ApiResponse from "../../Entity/ApiResponse.js"
import { ListFile, AddFile, DeleteFile } from "../../Core/services/file.mjs";
import config from "../../config.js";
import { parseJsonFromBodyData } from "./../../Core/Server.js";
import { GetDefaultFont, SetDefaultFont } from "./../../Core/services/font.js"

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
        let data = await ListFile(resPath, { filetype: ["ttf", "fon", "otf", "woff", "woff2", "ttc", "dfont"], detail: true });
        new ApiResponse(data.map(d => {
            d.url = "/font/" + d.file;//根目录就已开启了静态文件
            return d;
        })).toCTX(ctx);
    },
    // 更多路由...
});
```



## 7. 目录结构与路由映射

### 7.1 目录结构示例

```
Controller/
├── assets.js              # /assets/...
├── library/               # /library/...
│   ├── index.js           # /library/index/...
│   ├── chapter.js         # /library/chapter/...
│   └── tag.js             # /library/tag/...
├── review/                # /review/...
│   └── index.js           # /review/index/...
└── services/              # /services/...
    └── index.js           # /services/index/...
```

### 7.2 路由映射示例

| 文件路径                     | 路由定义               | 完整 API 路径              |
|------------------------------|------------------------|----------------------------|
| Controller/assets.js         | "get /download/:path"  | /assets/download/:path     |
| Controller/library/index.js  | "get /booklist"        | /library/index/booklist    |
| Controller/library/chapter.js| "get /:id"             | /library/chapter/:id       |
| Controller/review/index.js   | "post /book"           | /review/index/book         |

## 8. 开发流程

### 8.1 创建路由模块

1. 在 `Controller` 目录下创建新的 JavaScript 文件
2. 编写路由模块代码，遵循路由定义规范
3. 添加 Swagger 注释
4. 实现路由处理逻辑
5. 使用 `ApiResponse` 标准化响应

### 8.2 测试路由

1. 启动服务器：`node app.js`
2. 访问 Swagger 文档：`http://localhost:8777/swagger`
3. 在 Swagger 界面测试新创建的 API
4. 或使用 Postman、curl 等工具测试

## 9. 最佳实践

### 9.1 命名规范

- 路由模块文件名使用小写字母，单词间用下划线分隔（如：`book_with_rule.js`）
- 路由路径使用小写字母，单词间用连字符分隔（如：`/book/search`）
- HTTP 方法使用小写（如：`get`、`post`、`delete`）

### 9.2 代码组织

- 每个路由模块专注于一个功能领域
- 复杂的业务逻辑应封装到 Core 目录下的服务中
- 路由处理函数应保持简洁，主要负责参数验证和响应处理

### 9.3 安全性

- 始终验证用户输入参数
- 对敏感操作进行权限检查
- 处理文件上传时注意安全，避免路径遍历攻击
- 适当设置响应头，防止安全漏洞

## 10. 常见问题

### 10.1 路由未加载

- 检查文件是否在 `Controller` 目录下
- 检查文件扩展名是否为 `.js` 或 `.mjs`[^3]
- 检查模块是否正确导出函数

### 10.2 参数获取失败

- GET 请求使用 `ctx.query` 获取参数
- POST/PUT 请求使用 `ctx.request.body` 获取参数
- 路径参数使用 `ctx.params` 获取
- 上传文件使用 `parseJsonFromBodyData` 辅助函数解析

### 10.3 Swagger 文档不显示

- 检查 JSDoc 注释格式是否正确
- 确保 `@swagger` 标记正确
- 重启服务器刷新文档缓存

## 11. 总结

EbookWorkshop 的路由系统设计简洁高效，通过自动加载机制极大地简化了 API 开发流程。开发者只需按照规范编写路由模块，系统会自动完成路由注册、文档生成和错误处理等工作。

遵循本指南，可以快速开发高质量、标准化的 API 接口，提高开发效率并确保系统稳定性。

---
> 本文档由 AI 辅助生成

**Happy Coding!** 🚀


[^1]: CJS 模块需使用 `.js` 扩展名，且导出方式为 `module.exports = () => ({})`。
[^2]: ESM 模块需使用 `.mjs` 扩展名，且导出方式为 `export default {}`。
[^3]: 其他格式文件（如 `.json`、`.css`、`.html` 等）会被跳过，不会加载为路由。
