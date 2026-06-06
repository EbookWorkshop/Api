const path = require("path");
const ApiResponse = require("../../Entity/ApiResponse");
const File = require("../../Core/services/file.mjs");
const { config: { dataPath, FOLDER } } = require("../../Core/services/config");


module.exports = () => ({

    /**
     * @swagger
     * /import/add:
     *   post:
     *     tags:
     *       - Import —— 书库导入
     *     summary: 导入文件到书库
     *     description: 上传文件，并保存到书库目录下。
     *     consumes:
     *       - multipart/form-data
     *     parameters:
     *       - in: formData
     *         name: file
     *         type: file
     *         description: 要上传的文件
     *     responses:
     *       200:
     *         description: 请求成功
     *       600:
     *         description: 参数错误，参数类型错误
     */
    "post /add": async (ctx) => {
        const file = ctx.request.files?.file; // 获取上传的文件
        if (!file) {
            new ApiResponse(null, "请求参数错误", 60000).toCTX(ctx);
            return;
        }
        
        //TODO: 根据文件类型进行后续不同的处理

        // 指定保存文件的路径
        let filePath = path.join(dataPath, FOLDER.BookStorage, file.originalFilename);

        let rsl = await File.AddFile(file, filePath);
        new ApiResponse(rsl).toCTX(ctx);
    },
})