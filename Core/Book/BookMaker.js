/**
 * 负责制作书，将书入库
 */
const Ebook = require("../../Entity/Ebook/Ebook");
const Index = require("../../Entity/Ebook/Index");
const Chapter = require("../../Entity/Ebook/Chapter");
const Do2Po = require("../OTO/DO");
const path = require("path");
const { dataPath } = require("../../config");
const fs = require('fs');
const { CheckAndMakeDir } = require("../Server")
// const similarity = require('string-similarity'); // 新增相似度计算库
const SystemConfigService = require("../services/SystemConfig");
const Models = require("../OTO/Models");

class BookMaker {
    /**
     * 添加一本`TXT`书
     * @param {{
     * bookName:string,
     * chapters:Chapter[], //该书包含的章节
     * author:string,
     * conver:string}} book 书的配置
     */
    static async AddATxtBook({
        bookName, chapters, author, conver
    }) {

        let ebook = new Ebook({
            BookName: bookName,
            Author: author,
            CoverImg: conver,
        });

        ebook.FontFamily = await SystemConfigService.getConfig(SystemConfigService.Group.DEFAULT_FONT, "defaultfont");

        for (let c of chapters) {
            ebook.Index.push(new Index({
                Title: c.Title,
                OrderNum: c.OrderNum,
                HasContent: c.Content?.length > 0,
            }));
            ebook.Chapters.set(c.Title.trim(), c.Content);
        }

        return await Do2Po.EBookObjToModel(ebook);//持久化
    }

    /**
    * 创建一本空的书
    * @param {{
    * bookName:string,
    * author:string,
    * conver:string
    * }} book 书的配置
    */
    static async CreateEmptyBook({
        bookName, author, conver
    }) {
        let ebook = new Ebook({
            BookName: bookName,
            Author: author,
            CoverImg: conver || "#212f30",//灰色封面
        });
        ebook.FontFamily = await SystemConfigService.getConfig(SystemConfigService.Group.DEFAULT_FONT, "defaultfont");
        return await Do2Po.EBookObjToModel(ebook);
    }

    /**
     * 生成一个Txt的文件
     * @param {number} bookId 书ID 
     * @param {Array<number>?} showChpaters 需要包含的章节ID，不传则为全部
     * @param {boolean} embedTitle 是否嵌入标题 
     * @returns 
     */
    static async MakeTxtFile(bookId, showChpaters, embedTitle = true) {
        let ebook = await Do2Po.GetEBookById(bookId);
        if (ebook == null) return null;

        if (!showChpaters || showChpaters.length <= 0) {
            showChpaters = ebook.Index.map(item => item.IndexId);
        }
        await ebook.SetShowChapters(showChpaters);

        return new Promise((resolve, reject) => {
            const fileInfo = {
                filename: ebook.BookName + ".txt",
                path: path.join(dataPath, "Output", ebook.BookName + '.txt'),
                chapterCount: ebook.showIndexId.length           //含有多少章
            };

            CheckAndMakeDir(fileInfo.path);
            const writeStream = fs.createWriteStream(fileInfo.path);
            writeStream.on('error', function (err) {
                reject(err);
            });
            writeStream.on('finish', function () {
                resolve(fileInfo);
            });
            const author = ebook.Author ? `作者：${ebook.Author}\n` : '佚名';
            writeStream.write(`${ebook.BookName}\n${author}\n`);

            for (let i of ebook.showIndexId) {
                let c = ebook.GetChapter(i);
                if (embedTitle) writeStream.write(`${c.Title}\n${c.Content}\n\n`);
                else writeStream.write(`${c.Content}\n`);
            }
            writeStream.end();
        });
    }

    /**
     * 查找指定书籍中的重复/相似内容
     * @param {number} bookId 书籍ID
     * @param {number} [threshold=0.8] 相似度阈值（0-1）
     * @returns {Promise<Array<{original: Chapter, duplicates: Chapter[], similarity: number}>>}
     */
    static async FindDuplicateContents(bookId, threshold = 0.5) {
        const ebook = await Do2Po.GetEBookById(bookId);
        if (!ebook) throw new Error('书籍不存在');

        // 创建相似度映射表
        const duplicates = [];
        const processed = new Set();            // 已命中的章节索引

        const myModels = Models.GetPO();
        const chipLen = 100;
        for (let i of ebook.Index) {
            if (!i.IsHasContent) continue;//跳过没有内容的章节

            let curChap = await ebook.ReloadChapter(i.IndexId);
            if (processed.has(curChap.IndexId)) continue;//已处理过命中的

            let simple = Array(5).fill(0).map(n => {
                let t = Math.floor(Math.random() * 1000000000000000 % (curChap.Content.length - chipLen));
                return curChap.Content.slice(t, t + chipLen);
            });
            let simpleWhere = simple.map(n => {
                return {
                    [Models.Op.like]: `%${n}%`
                }
            })

            let res = await myModels.EbookIndex.findAll({
                where: {
                    BookId: ebook.BookId,
                    id: {
                        [Models.Op.ne]: i.IndexId
                    },
                    Content: {
                        [Models.Op.or]: simpleWhere
                    }
                }
            });

            processed.add(i.IndexId);
            if (res.length <= 0) continue;
            let rslCount = [];
            for (let r of res) {
                let similarity = 0;
                for (let s of simple) {
                    if (r.Content.includes(s)) similarity += 1;
                }

                if (similarity / simple.length < threshold) continue;       // 相似度小于阈值，跳过

                rslCount.push({
                    id: r.id,
                    title: r.Title,
                    similarity: similarity / simple.length
                });
                processed.add(r.id);
            }

            duplicates.push({
                original: {
                    id: curChap.IndexId,
                    title: curChap.Title,
                },
                duplicates: rslCount.sort((a, b) => b.similarity - a.similarity),
            });
        }
        return duplicates;
    }

    /**
     * 章节重构
     * @param {*} settings 
     */
    static async RestructureChapters(settings) {
        const _setChapter = (baseCp) => {
            let chapterSetting = {
                updateTime: new Date()
            };
            if (baseCp.bookId) chapterSetting.BookId = baseCp.bookId;
            if (baseCp.title) chapterSetting.Title = baseCp.title;
            if (baseCp.content) chapterSetting.Content = baseCp.content;
            if (baseCp.orderNum) chapterSetting.OrderNum = baseCp.orderNum;
            return chapterSetting;
        }

        let myModels = Models.GetPO();
        let t = await myModels.sequelize.transaction();
        try {
            const bookId = settings.bookId;
            if (!bookId) { console.error("章节重构需要提供书籍ID"); return; }

            const baseCp = settings?.baseChapter;
            if (baseCp?.chapterId) {
                const chapterSetting = _setChapter(baseCp);
                await myModels.EbookIndex.update(chapterSetting, {
                    where: {
                        id: baseCp.chapterId
                    },
                    transaction: t
                });
                const operations = settings?.operations;
                if (!operations || operations.length <= 0) {
                    await t.commit();
                    return;
                }
                //基准章节后续章节后移
                await myModels.EbookIndex.update({
                    OrderNum: myModels.sequelize.literal('OrderNum + ' + operations.length)
                }, {
                    where: {
                        BookId: bookId,
                        OrderNum: {
                            [Models.Op.gt]: baseCp.orderNum
                        }
                    },
                    transaction: t
                });
            }

            for (let chap of settings?.operations) {
                for (let cp of chap.chapters) {
                    const curChapSetting = _setChapter(cp);
                    switch (chap.operationType) {        //[update, delete, create]
                        case "delete":
                            await myModels.EbookIndex.destroy({
                                where: {
                                    id: cp
                                },
                                transaction: t
                            });
                            break;
                        case "create":
                            curChapSetting.BookId = bookId;
                            await myModels.EbookIndex.create(curChapSetting, { transaction: t });
                            break;
                        case "update":
                            await myModels.EbookIndex.update(curChapSetting, {
                                where: {
                                    id: cp.chapterId
                                },
                                transaction: t
                            });
                            break;
                    }
                }
            }

            await t.commit();
        } catch (err) {
            t.rollback();
            throw err;
        }
    }
}
module.exports = BookMaker;
