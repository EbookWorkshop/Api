/**
 * 标准接口结果返回
 * TO (Transfer 0bject)，数据传输对象、传输数据的对象
 */
class ApiResponse {
    /**
     * 标准接口结果返回结构
     * @param {*} data 实际数据载荷
     * @param {*} msg 返回的信息描述
     * @param {*} code 执行状态：成功：20000，50000：服务器执行失败，60000：用户引起的失败
     * @param {*} status 其它状态信息
     */
    constructor(data, msg, code = 20000, status = 0) {
        this.status = status;
        this.msg = msg || (code === 20000 ? "" : "API未知错误");
        this.code = code;
        this.data = data || null;

    }

    /**
     * 取得结果的字符串
     * @returns {string} {code,msg,status,data}
     */
    getJSONString() {
        return JSON.stringify({
            code: this.code,
            msg: this.msg,
            status: this.status,
            data: this.data
        })
    }

    /**
     * 将结果设置到ctx中
     * @param {*} ctx 
     */
    toCTX(ctx) {
        // ctx.status = this.code / 100;
        if (ctx.status == 404) {
            ctx.status = 200;//处理已成功拿到数据但接口状态是404的特殊情况
        } else if (ctx.status != 200) {
            this.code = ctx.status * 100;

            if (this.msg === "") {
                this.msg = `接口出现未正确响应的响应！一般这是API的响应不符合约束规范导致的。更多细节留意API后台输出。\nAPI：${ctx.request.url}`;
                console.log(ctx);
            }

            ctx.status = 200;//前端需要全部返回200 才能正确显示提示信息
        } else if (ctx.status == 200 && this.code != 20000) {
            this.code = 20000;//以防哪个API忘了设置Code 为20000了
        }
        ctx.body = this.getJSONString();
    }

    /**
     * 生成一个仅含‘成功’、‘失败’的返回结果
     * @param {*} result 是否成功
     * @param {*} msg 相关信息
     * @returns 
     */
    static GetResult(result, msg) {
        return new ApiResponse(result, msg, result ? 20000 : 50000);
    }
}

module.exports = ApiResponse;