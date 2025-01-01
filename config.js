//用的JS文件，不是JSON文件，为了可以写注释

const { initForm } = require("pdfkit");

module.exports = {
    /**
     * 书库-产物的存储目录    
     * 路径结尾不含斜线`/`
     */
    dataPath: "./../MyLibrary/Data",

    /**
     * 数据库存放路径
     */
    databasePath: "./../MyLibrary/Data/library/save.sqlite",

    /**
     * 输出调试信息，监听debug消息
     */
    debug: true,

    debugSwitcher: {            //调试开关-当打开时将接收打印该模块的调试信息
        /**
         * 是否监控模块装载情况
         */
        init: false,
        /**
         * 是否开启数据库调试
         */
        database: false,
        /**
         * 是否开启线程池调试
         */
        workerPool: true,
        /**
         * 是否开启邮件服务调试
         */
        email: true,
        /**
         * 是否开启爬虫调试
         */
        puppeteer: true,
        /**
         * 是否开启路由调试
         */
        router: false,
        /**
         * 是否开启PDF制作调试
         */
        pdf: true,
        /**
         * 是否开启书籍目录更新调试
         */
        bookIndex: true,
        /**
         * 是否开启书籍章节更新调试
         */
        bookChapter: true,
    },

}