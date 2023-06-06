# EbookWorkShop
文本图书管理工坊

## 初始化
```
npm install --registry=http://registry.npmmirror.com
```

## 运行
```
node app
```
前后端一起启动（需要在公共的父级目录执行）
```
wt --maximized -d %cd%\\EBWFrontEnd PowerShell -c npm run dev;split-pane -d %cd%\\EbookWorkshop node --inspect app
```
>  --inspect 参数用于远程附加


## 调试
http://localhost:8777/swagger

