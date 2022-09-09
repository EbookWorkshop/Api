# Controller 层
自动路由配置由`/Controller/router.js`文件实现。通过递归加载Controller文件夹内所有子目录及js文件实现自动装载/配置路由。

## 自动路由
可以通过添加符合格式的文件，实现自动识别、注册路由。可方便避免反复配置路由。

## 自动路由规则
实际路由将由`当前文件夹路径`+`当前文件名`+`当前方法名`决定。    
假如在文件`/Controller/partA/partB/file.js`，抛出对象如下：
```js
{
    "get /action":()=>{/* do something */},
    "post /fun/dosomething":()=>{/* do something */}
}
```
则在模块成功装载后，会配置路由：
```
GET     /partA/partB/file/action
```
和
```
POST    /partA/partB/file/fun/dosomething
```

## 例外规则
非`.js`后缀文件不会装载

## 注意事项
每个目录下都应有一个`index.js`文件，不然会有装载失败的提示（但不影响）