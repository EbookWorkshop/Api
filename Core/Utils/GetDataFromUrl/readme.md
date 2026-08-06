模块|职责
--|--
Fetchers|	从http/puppeteer获取page对象 → 调用规则引擎提取结果 → 返回结果
Engines|	纯规则执行，不关心数据来源
index.js	|导出 RunTask 作为统一入口，根据 scraping 模式组装上述模块。

```
src/
├── index.js                     # 入口，导出 RunTask
├── Fetchers/
│   ├── http.js           # HTTP 抓取：请求HTML → 加载到页面 → 调用规则引擎 
│   └── puppeteer.js      # Puppeteer 抓取：导航到页面 → 调用规则引擎 → 记录重定向
└── Engines/
    └── rule.js            # 规则执行核心（GetDataUseRuleFromPage + ExecRule + isExec + UseDictReplace）
    └── dictionary.js      # 将结果用字典翻译
    
```