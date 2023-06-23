const ApiResponse = require("../Entity/ApiResponse");


module.exports = () => ({
    /**
     * @swagger
     * /user/login:
     *   get:
     *     tags:
     *       - User —— 用户管理
     *     summary: 登陆
     *     description: 拿到登陆的Token
     *     consumes:
     *       - application/json
     *     responses:
     *       200:
     *         description: 请求成功
     *       500:
     *         description: 请求失败
     */
    "post /login": async (ctx) => {
        new ApiResponse({
            token: '12134'
        }).toCTX(ctx);
    },
    "get /info": ctx => {
        new ApiResponse({
          name: 'admin',
          avatar: '/src/assets/logo-dark.svg',
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
        }).toCTX(ctx);
    },
    "get /menu": ctx => {
        new ApiResponse([
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
      ]).toCTX(ctx);
    }
});