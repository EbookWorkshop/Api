import puppeteer from 'puppeteer'
import Iconv from 'iconv-lite';
import { URL } from 'node:url';
import http from "node:http"
import https from "node:https"

import { GetDataUseRuleFromPage } from "../Engines/rule.js";


/**
 * 尝试直接获取网址的文本内容
 * 注意网页中的脚本可能加载不了
 * @param {string} url 
 * @param {object} setting
 */
export async function FetchTextByHttp(url, setting) {
    const htmlSourceString = await requestTextByHttp(url, setting);
    return await parseHtmlString(htmlSourceString, url, setting);
}



/**
 * 
 * @param {*} url 
 * @param {*} setting 
 * @returns {string} 返回网页源码
 */
async function requestTextByHttp(url, setting) {
    try {
        let tUrl = new URL(url);
        const isHttps = tUrl.protocol === "https:";

        let options = {
            method: "GET",
            timeout: setting.timeout,
            headers: {
                'Content-Type': `application/x-www-form-urlencoded`,
                ...(setting.userAgent ? { 'User-Agent': setting.userAgent } : {}),
            },
            hostname: tUrl.hostname,
            path: tUrl.pathname + (tUrl.search || ""),
            port: tUrl.port,
            ...(isHttps ? { rejectUnauthorized: false } : {}),
        };

        let client = isHttps ? https : http;

        return await new Promise((resolve, reject) => {
            client.request(options, (res) => {
                const chunks = [];
                res.on("data", chunk => { chunks.push(chunk); });
                res.on("error", err => reject(err));
                res.on("end", () => {
                    try {
                        // 合并所有字节后再解码（避免跨包截断）
                        const buffer = Buffer.concat(chunks);
                        const htmlString = buffer.toString("utf-8");

                        // 检测实际编码
                        let charset = detectCharset(res.headers, htmlString.substring(0, Math.min(htmlString.length, 8192)));

                        // 解码
                        let result = "";
                        if (charset === 'utf-8' || charset === 'utf8') {
                            result = htmlString;
                        } else {
                            result = Iconv.decode(buffer, charset);
                        }

                        resolve(result);
                    } catch (err) {
                        reject(new Error(`解码失败: ${err.message}`));
                    }
                });
            }).end();
        })
    } catch (err) {
        console.warn("[执行失败]FetchTextByHttp::", err.message, url);
        throw err;
    }
}

/**
 * 解释字符串，获取配置的规则提取内容
 * 以Dom方式提取
 * @param {*} htmlString 
 * @param {*} setting 
 * @returns result<Map>
 */
async function parseHtmlString(htmlString, url, setting) {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // 将传入的 HTML 字符串设置为页面内容
    //    'about:blank' 是目标URL，核心是 setContent 方法
    await page.setContent(htmlString, {
        waitUntil: 'networkidle0' // 等待网络和脚本加载完成
    });

    let result = new Map();
    result = await GetDataUseRuleFromPage(page, setting.RuleList);
    await browser.close();

    // //整理结果-将相对地址改为绝对地址
    // let tUrl = new URL(url);
    // for (let r of result.values()) {
    //     for (let v of r) {
    //         if (v.url && v.url.startsWith("/")) v.url = `${tUrl.origin}${v.url}`;       //需要换算相对地址
    //     }
    // }

    return result;
}

/**
 * 获取网页的实际编码方式
 * * 通过请求头的Content-Type获取
 * * 通过网页源码的meta标签charset属性获取
 * @param {*} headers 
 * @param {*} html 
 * @returns 小写格式 字符编码
 */
function detectCharset(headers, html) {
    // 1. 优先从 Content-Type 获取
    const ct = headers["content-type"] || "";
    const charsetMatch = ct.match(/charset\s*=\s*([^\s;]+)/i);
    if (charsetMatch) {
        return charsetMatch[1].toLowerCase();
    }

    // 2. 从 HTML meta 标签检测
    const metaMatch = html.match(/<meta[^>]*charset\s*=\s*["']?([^"'\s>]+)/i);
    if (metaMatch) {
        return metaMatch[1].toLowerCase();
    }

    return 'utf-8';
}
