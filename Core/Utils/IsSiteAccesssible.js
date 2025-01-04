//检查网站是否可以访问的工具
const https = require('https');

function isSiteAccessible(hostname) {
    return new Promise((resolve, reject) => {
        hostname = hostname.replace(/https?:\/\//, ''); // 去掉http://或https://
        // 发送HTTPs请求
        https.get({ hostname, timeout: 5000 }, response => {
            // 只要状态码在200-301之间，就视为成功
            if (response.statusCode >= 200 && response.statusCode <= 301) {
                resolve(true);
            } else {
                resolve(false);
            }
        }).on('error', () => {
            // 如果请求失败，返回false
            resolve(false);
        }).on('timeout', () => {
            // 如果请求超时，返回false
            resolve(false);
        });
    });
}


exports.isSiteAccessible = isSiteAccessible;