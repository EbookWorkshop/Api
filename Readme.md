# EbookWorkShop
文本图书管理工坊

## 初始化
```
npm install --registry=http://registry.npmmirror.com
```
若初始化出错看[初始化错误处理](#初始化错误处理)

## 运行
```
node app
```
前后端一起启动（需要在公共的父级目录执行）
```
wt --maximized -d %cd%\\EBWFrontEnd PowerShell -c npm run dev;split-pane -d %cd%\\EbookWorkshop node --inspect app
```
```bat
:: PowerShell 不能运行 npm 时
wt --maximized -d %cd%\\EBWFrontEnd cmd /K npm run dev;split-pane -d %cd%\\EbookWorkshop node --inspect app
```
>  --inspect 参数用于远程附加


## 开放接口调试 & 文档
http://localhost:8777/swagger

## 相关文档
* 数据库查询    https://www.sequelize.cn/


## 初始化错误处理
### 报错关键字 PUPPETEER_SKIP_DOWNLOAD
具体出错格式类似：
>Failed to set up chrome vXXX.XXX.XXX! Set "PUPPETEER_SKIP_DOWNLOAD" env variable to skip download.
     
出现上述原因是因为安装 puppeteer 时，需要从google下载对应的浏览器版本，但下载的服务器地址访问不了（国内常见问题），这时可以①多试几次，②挂代理，或③手工下载并设置浏览器。
#### 手工下载并设置浏览器的方法
##### 首先，先完成安装 puppeteer
先检查目录 `./node_modules/puppeteer` 存在，里面有文件。如有，则可以跳过这步。
###### 用跳过下载的方式先安装 puppeteer
先设置运行变量跳过下载浏览器
```powershell
$env:PUPPETEER_SKIP_DOWNLOAD="true"
```
或
```bat
SET PUPPETEER_SKIP_DOWNLOAD=true
```
然后继续安装（npm i 或其他），正常情况这会安装完，用之前方法检查puppeteer文件夹是否已有内容。

##### 然后，手工下载设置浏览器
默认下载地址在`https://storage.googleapis.com/chrome-for-testing-public`，找个可用的镜像，比如：`https://registry.npmmirror.com/binary.html?path=chrome-for-testing/`。
* 在之前的报错格式里找到提示出错的版本，比如`chrome vXXX.XXX.XXX.XXX`。在打开的下载页面找到对应的浏览器、版本、平台，下载备用。
* 找到浏览器缓存的目录，一般是`C:\Users\当前用户登陆名\.cache\puppeteer\浏览器名\平台-版本号`。对应刚才的例子则是：`C:\Users\当前用户登陆名\.cache\puppeteer\chrome\win64-XXX.XXX.XXX.XXX`
* 将之前下载的浏览器文件解压到上述文件夹内，如刚才例子则是：`C:\Users\当前用户登陆名\.cache\puppeteer\chrome\win64-XXX.XXX.XXX.XXX\chrome-win64`，其中`chrome-win64`一般是压缩包的根文件夹。
* 确保chrome.exe在正确路径：`C:\Users\当前用户登陆名\.cache\puppeteer\chrome\win64-XXX.XXX.XXX.XXX\chrome-win64\chrome.exe`
* 到目录`./node_modules/puppeteer`中执行`node install.mjs`若不再出现其它版本报错，则完成了设置。（如果在之前设置环境变量的同一个对话框，还得先将变量设置回来`SET PUPPETEER_SKIP_DOWNLOAD=false`）不然会跳过下载。

运行项目，使用爬书相关的功能。无报错即可。