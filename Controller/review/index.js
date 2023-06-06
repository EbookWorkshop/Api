//空路由，避免自动加载路由功能报错
module.exports = {"get ":async (ctx) => {ctx.status = 404;}}