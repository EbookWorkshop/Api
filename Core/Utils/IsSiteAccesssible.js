//检查网站是否可以访问的工具
import https from 'https';


export function isSiteAccessible(hostname) {
    return new Promise((resolve, reject) => {
        hostname = hostname.replace(/https?:\/\//, ''); // 去掉http://或https://
        // 发送HTTPs请求
        https.get({ hostname, timeout: 5000 }, (response) => {
            let html = "";
            let resTitle = "";
            const resUrl = response.headers.location || response.client._host;
            response.on('data', (chunk) => {
                html += chunk;
            });
            response.on("end", () => {
                const title = html.match(/<title>([^<]+)<\/title>/);
                if (title?.length >= 2) resTitle = title[1];

                resolve({
                    status: response.statusCode,
                    result: false,
                    location: resUrl,
                    title: resTitle,
                });
            });

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