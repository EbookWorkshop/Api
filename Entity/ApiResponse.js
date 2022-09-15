/**
 * 标准接口结果返回
 */
class ApiResponse {
    /**
     * 标准接口结果返回结构
     * @param {*} data 实际数据载荷
     * @param {*} msg 返回的信息描述
     * @param {*} code 执行状态：成功：20000，
     * @param {*} status 其它状态信息
     */
    constructor(data, msg, code = 20000, status = 0) {
        this.status = status;
        this.msg = msg || (code === 20000 ? "" : "未知错误");
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
}

module.exports = ApiResponse;