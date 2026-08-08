import { URL } from "node:url";


/**
 * 根据网址返回对应的站点
 * @param {string} urlString 需要分析的网址
 * @returns 返回纯粹的域名如 www.abc.com
 */
export function GetHost(urlString) {
    try {
        if (!/^https?:\/\//i.test(urlString)) {
            urlString = 'http://' + urlString;
        }
        let urlObj = new URL(urlString);
        let host = urlObj.host;
        return host;
    } catch (err) {
        console.error(err);
    }
}
