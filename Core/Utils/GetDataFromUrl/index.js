import { FetchTextByHttp } from "./Fetchers/http.js"
import { FetchTextByPuppeteer } from "./Fetchers/puppeteer.js"




/**
 * 多线程执行入口
 * @param {{url:string, setting:object}} param 参数
 * @returns {Promise<Map<string,any>>}
 */
export async function RunTask(param) {
    let result = null;
    const { setting, url } = param;
    if (setting.scraping === "http") {
        result = await FetchTextByHttp(url, setting);
    } else {        //if (param.scraping === "puppeteer")
        result = await FetchTextByPuppeteer(url, setting);
    }
    return result
}



export {
    FetchTextByHttp,
    FetchTextByPuppeteer,
}