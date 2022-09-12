
module.exports = () => ({
    /**
     * @swagger
     * /library/booklist:
     *   get:
     *     tags:
     *       - Library —— 图书馆
     *     summary: 拿到所有书的信息
     *     description: 拿到所有书的信息
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 请求失败
     */
    "post /login": async (ctx) => {
        ctx.body = JSON.stringify({
            token: '12134'
        })
    },
    "get /info": ctx => {
        ctx.body = JSON.stringify({
          name: 'admin',
          avatar:
            '//lf1-xgcdn-tos.pstatp.com/obj/vcloud/vadmin/start.8e0e4855ee346a46ccff8ff3e24db27b.png',
          email: '',
          job: '',
          jobName: '',
          organization: '',
          organizationName: '',
          location: '',
          locationName: '',
          introduction: '',
          personalWebsite: '',
          phone: '',
          registrationDate: '',
          accountId: '9527',
          certification: 1,
          role: 'admin',
        })
    },
    "get /menu": ctx => {
        ctx.body = JSON.stringify([
        {
          path: '/dashboard',
          name: 'dashboard',
          meta: {
            locale: 'menu.server.dashboard',
            requiresAuth: true,
            icon: 'icon-dashboard',
            order: 1,
          },
          children: [
            {
              path: 'workplace',
              name: 'Workplace',
              meta: {
                locale: 'menu.server.workplace',
                requiresAuth: true,
              },
            },
            {
              path: 'https://arco.design',
              name: 'arcoWebsite',
              meta: {
                locale: 'menu.arcoWebsite',
                requiresAuth: true,
              },
            },
          ],
        },
      ])
    }
});