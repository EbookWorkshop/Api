//检查网站是否可以访问的工具
const https = require('https');

function isSiteAccessible(hostname) {
    return new Promise((resolve, reject) => {
        hostname = hostname.replace(/https?:\/\//, ''); // 去掉http://或https://
        // 发送HTTPs请求
        https.get({ hostname, timeout: 5000 }, response => {
            // 只要状态码在200-500之间，就视为成功
            // 4xx是用户端错误，但站点本身是可以访问的
            if (response.statusCode >= 200 && response.statusCode < 500) {
                resolve({
                    status: response.statusCode,
                    result: true
                });
            } else {
                resolve({
                    status: response.statusCode,
                    result: false
                });
            }
        }).on('error', (err) => {
            // 如果请求失败，返回false
            resolve({
                status: -500,
                result: false,
                error: err
            });
        }).on('timeout', () => {
            // 如果请求超时，返回false
            resolve({
                status: -504,
                result: false
            });
        });
    });
}


exports.isSiteAccessible = isSiteAccessible;