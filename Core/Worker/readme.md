# 线程池

## 调用示例
```js
const pool = WorkerPool.GetWorkerPool();
pool.RunTask({
    taskfile: "filepath",           //需要用线程启用的方法 兼容多线程运行的入口为： `exports.RunTask`
    param: { }                      //启用线程的参数，注意：只支持可序列化对象
}, (result, err) => {
    //成功的回调函数
});
```

## 实现线程支持
```js
exports.RunTask = function(param){}
```