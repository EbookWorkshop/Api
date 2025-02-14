# 线程池

## 调用示例
其中`filepath`为需要多线程执行的js文件，文件入口为RunTask。`filePath` 可以以`@`开头代表相对根目录。
```js
const pool = WorkerPool.GetWorkerPool();
pool.RunTask({
    taskfile: "filepath",           //需要用线程启用的方法 兼容多线程运行的入口为： `exports.RunTask`
    param: { }                      //启用线程的参数，注意：只支持可序列化对象
}, (result, err) => {
    //成功的回调函数
});
```
或者：
```js
const pool = WorkerPool.GetWorkerPool();
pool.RunTaskAsync({
    taskfile:"@/path/to/task",
    param:{}
}).then(result=>{
    //成功的处理
}).catch(err=>{
    //失败时的处理
})
```

## 实现线程支持
```js
exports.RunTask = function(param){}
```

## AsyncResource
使用 AsyncResource 主要是让回调函数可以跟踪调用堆栈。