

module.exports = () => ({
    /**
     * @swagger
     * /library/booklist:
     *   get:
     *     tags:
     *       - Library - 图书馆
     *     summary: 拿到所有书的信息
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 请求失败
     */
    "get /booklist": (ctx) => {
        ctx.set('Content-Type', 'application/json');

    }
});