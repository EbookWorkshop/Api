/**
 * 负责制作书，将书入库
 */
import fs from "node:fs";
import path from "node:path";
import { finished } from 'stream/promises';
import similarity from 'string-similarity'; // 新增相似度计算库

import Ebook from "../../Entity/Ebook/Ebook.js";
import Index from "../../Entity/Ebook/Index.js";
import Chapter from "../../Entity/Ebook/Chapter.js";
import Volume from "../../Entity/Ebook/Volume.js";

import { config } from "../services/config.js";
import Do2Po from "../OTO/DO/index.js";
import Models from "../OTO/Models/index.js";
import { CheckAndMakeDir } from "../Server.js"
import SystemConfigService from "../services/SystemConfig.js";
import { FindMyChapters } from "./FindMyChapters.js";

const { dataPath, FOLDER } = config;
export const SHOW_BOOKNAME = "#showname";

export default class BookMaker {
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
        return await Do2Po.EBookObjToModel(ebook);
    }

    /**
     * 生成一个Txt的文件
     * 先判断volumes，不为空则按卷生成书；若空则按showChapters生成指定章节；若showChapters为空则按生成全书
     * @param {number} bookId 书ID 
     * @param {Array<number>?} volumes 需要包含的卷ID
     * @param {Array<number>?} showChapters 需要包含的章节ID
     * @param {boolean} embedTitle 是否嵌入标题 
     * @param {boolean} enableIndent 是否启用段落缩进
     * @returns 
     */
    static async MakeTxtFile(bookId, volumes, showChapters, embedTitle = true, enableIndent = false) {
        let ebook = await Do2Po.GetEBookById(bookId);
        if (ebook == null) return null;

        const showIndexId = FindMyChapters(ebook, volumes, showChapters);
        await ebook.SetShowChapters(showIndexId);

        await ebook.LoadIntroduction();

        const fileInfo = {
            filename: ebook.BookName + ".txt",
            path: path.join(dataPath, FOLDER.TempBookOutput, ebook.BookName + '.txt'),
            chapterCount: ebook.showIndexId.length,           //含有多少章
            chapterIds: showIndexId
        };

        CheckAndMakeDir(fileInfo.path);
        const writeStream = fs.createWriteStream(fileInfo.path);

        const author = ebook.Author ? `作者：${ebook.Author}\n` : '佚名';
        writeStream.write(`${ebook.BookName}\n${author}\n`);

        if (ebook.Introduction) {
            writeStream.write(`简介：\n${ebook.Introduction}\n\n`);
        }

        let vM = new Map();
        // 按卷分类章节
        for (let i of ebook.showIndexId) {
            let c = ebook.GetChapter(i);
            if (!vM.has(c.VolumeId)) {
                vM.set(c.VolumeId, new Array());
            }
            vM.get(c.VolumeId).push(c);
        }
        if (vM.has(null)) {
            ebook.Volumes.push(new Volume({
                id: null,
                Title: "未分卷章节",
                Introduction: ""
            }));
        }
        for (let e of ebook.Volumes) {
            if (!vM.has(e.VolumeId)) continue;
            if (e.VolumeId) writeStream.write(`\n=== ${e.Title} ===\n\n${e.Introduction}\n\n\n\n`);
            for (let c of vM.get(e.VolumeId)) {
                let content = c.Content || "-=章节内容缺失=-";
                if (enableIndent) {
                    let multiLine = content.split("\n");
                    multiLine = multiLine.map(t => `\t${t.trimStart()}`);    //去除行首空格
                    content = multiLine.join("\n");
                }
                if (embedTitle) writeStream.write(`${c.Title}\n${content}\n\n`);
                else if (content) writeStream.write(`${content}\n`);
                else writeStream.write(`--当前章节内容缺失--\n\n`);
            }
        }
        writeStream.end();
        await finished(writeStream);
        return fileInfo;
    }

    /**
     * 查找指定书籍中的重复/相似内容
     * @param {number} bookId 书籍ID
     * @param {number} [threshold=0.36] 相似度阈值（0-1）
     * @returns {Promise<Array<{original: Chapter, duplicates: Chapter[], similarity: number}>>}
     */
    static async FindDuplicateContents(bookId, threshold = 0.36) {
        // 创建相似度映射表
        const duplicates = [];

        const myModels = Models.GetPO();
        const chapters = await myModels.EbookIndex.findAll({
            where: {
                BookId: bookId,
                OrderNum: { [Models.Op.gte]: 0 },  // 只查找正序章节
                Content: { [Models.Op.ne]: null } // 确保内容不为空
            },
            order: [['OrderNum', 'ASC']]
        });

        if (!chapters || chapters.length <= 0) throw new Error('书籍没有章节或章节内容为空');

        for (let i = 0; i < chapters.length; i++) {
            let curResult = {
                original: {
                    id: chapters[i].id,
                    title: chapters[i].Title,
                },
                duplicates: []
            }
            for (let j = i + 1; j < chapters.length; j++) {
                const ratio = chapterInfos[i].length / (chapterInfos[j].length || 1);
                if (ratio < 0.7 || ratio > 1.3) continue;// 长度相差太大，跳过

                const sim = similarity.compareTwoStrings(
                    chapters[i].Content || "",
                    chapters[j].Content || ""
                );      //计算出的相似度
                if (sim >= threshold) {
                    curResult.duplicates.push({
                        id: chapters[j].id,
                        title: chapters[j].Title,
                        similarity: sim.toFixed(3)
                    });
                }
            }
            if (curResult.duplicates.length > 0) {
                duplicates.push(curResult);
            }
        }
        return duplicates;
    }

    /**
     * # 章节重构
     * ## 支持插入、更新、删除章节
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
            if (baseCp.volumeId) chapterSetting.VolumeId = baseCp.volumeId;
            return chapterSetting;
        }

        let myModels = Models.GetPO();
        let t = await myModels.BeginTrans();
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
                //计算总章节偏移量：
                let moveLength = operations.filter(item => item.operationType !== "delete").reduce((sum, item) => sum + item.chapters.length, 0);

                //基准章节后续章节后移
                await myModels.EbookIndex.update({
                    OrderNum: myModels.sequelize.literal('OrderNum + ' + moveLength)
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
                    const curChapSetting = chap.operationType !== "delete" ? _setChapter(cp) : {};
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
            await t.rollback();
            throw err;
        }
    }

    /**
     * # 批量插入章节
     * @param {*} bookId 将插入的书籍
     * @param {*} volumeId 插到指定卷中，-1为不设置卷
     * @param {Array<{Content:string,OrderNum:number,Title:string}>} chapters 章节列表
     */
    static async BatchInsertChapters(bookId, volumeId, chapters) {
        try {
            const myModels = Models.GetPO();
            const t = await myModels.BeginTrans();
            //先找到最大的序号
            let maxOrderNum = await myModels.EbookIndex.max('OrderNum', {
                where: {
                    BookId: bookId
                }
            });
            if (!maxOrderNum) maxOrderNum = 1;
            //序号从最大序号+1开始
            maxOrderNum++;
            for (let cp of chapters) {
                cp.OrderNum += maxOrderNum;
                cp.BookId = bookId;
                if (volumeId >= 0) cp.VolumeId = volumeId;
            }

            //插入章节
            await myModels.EbookIndex.bulkCreate(chapters, { transaction: t });

            await t.commit();
            return true;
        } catch (err) {
            return err;
        }
    }

    /**
     * 删除指定章节
     * @param {int} chapterId 
     */
    static async DeleteAChapter(chapterId) {
        try {
            const myModels = Models.GetPO();
            return await myModels.EbookIndex.destroy({
                where: {
                    id: chapterId
                }
            });
        } catch (err) {
            return false;
        }
    }

    /**
     * 切换章节的隐藏状态
     * 当章节排列序号小于0时不显示在列表，就是隐藏的
     * @param {int} chapterId
     * @param {*} chapterId 
     * @returns 
     */
    static async ToggleAChapterHide(chapterId) {
        try {
            const myModels = Models.GetPO();
            return await myModels.EbookIndex.update({
                OrderNum: myModels.sequelize.literal('OrderNum * -1')
            }, {
                where: {
                    id: chapterId
                }
            });
        } catch (err) {
            return false;
        }
    }

    /**
     * 保存电子书简介
     * @param {*} bookId 书籍ID
     * @param {*} intro 简介
     * @returns 
     */
    static async EditEbookIntroduction(bookId, intro) {
        const myModels = Models.GetPO();
        const t = await myModels.BeginTrans();
        try {
            //放弃：下列方法需要确保'BookId', 'Title'在模型定义中包含唯一约束（在模型定义中增加复合唯一索引）
            //但考虑都可能存在书籍章节名称相同的情况，故不使用
            // const myModels = Models.GetPO();
            // let rsl = await myModels.EbookIndex.upsert({
            //     BookId: bookId,
            //     Title: Chapter.IntroductionName,
            //     Content: intro,
            //     OrderNum: -1
            // }, {
            //     fields: ['Content', 'OrderNum'], // 更新的字段
            //     conflictFields: ['BookId', 'Title'] // 判断是否存在的字段
            // });
            // return rsl;

            // 先尝试查找现有记录
            const existing = await myModels.EbookIndex.findOne({
                where: {
                    BookId: bookId,
                    Title: Chapter.IntroductionName
                },
                transaction: t
            });

            let rsl;
            if (intro?.includes("简介：")) {
                intro = intro.substring(intro.indexOf("简介：") + 3);
            }
            if (existing) {
                // 存在则更新
                rsl = await myModels.EbookIndex.update({
                    Content: intro,
                    OrderNum: -1,
                    // updatedAt: new Date()        //TODO：可以确认下updatedAt是否会自动更新
                }, {
                    where: { id: existing.id },
                    transaction: t
                });
            } else {
                // 不存在则创建
                rsl = await myModels.EbookIndex.create({
                    BookId: bookId,
                    Title: Chapter.IntroductionName,
                    Content: intro,
                    OrderNum: -1,
                    // createdAt: new Date(),
                    // updatedAt: new Date()
                }, { transaction: t });
            }

            await t.commit();
            return rsl;
        } catch (e) {
            await t.rollback();
            // console.log(e);
            return null;
        }
    }

    /**
     * 修改电子书元数据
     * @param {number} id 书ID
     * @param {*} metadata 
     * @returns 
     */
    static async EditEBookInfo(id, metadata) {
        const myModels = Models.GetPO();
        try {

            if (metadata.Introduction) {
                await this.EditEbookIntroduction(id, metadata.Introduction);
                delete metadata.Introduction; //删除简介字段 后续用metadata直接更新数据库
            }

            if (metadata.converFile || typeof (metadata.CoverImg) !== "undefined") {    //更新了封面——图片格式或‘线装本’配色格式
                const { AddFile, DeleteFile } = await import("../services/file.mjs");
                const book = await myModels.Ebook.findByPk(id);
                const oldCoverImg = book.CoverImg?.replace(SHOW_BOOKNAME, "");

                if (metadata.converFile) {//图片格式封面
                    const newCoverName = metadata.converFile.originalFilename.includes(book.BookName) ?
                        metadata.converFile.originalFilename :
                        `${book.BookName}_${metadata.converFile.originalFilename}`;
                    const coverPath = path.join(FOLDER.BookCover, newCoverName);
                    await AddFile(metadata.converFile, path.join(dataPath, coverPath));
                    let isEmbelName = metadata.CoverImg === SHOW_BOOKNAME;          //如果是新上传的文件，需要在CoverImg字段记录嵌入标记
                    delete metadata.converFile;
                    metadata.CoverImg = coverPath + (isEmbelName ? SHOW_BOOKNAME : "");
                    if (!metadata.CoverImg.startsWith("/")) metadata.CoverImg = "/" + metadata.CoverImg;//确保以/做地址开头
                }

                if (metadata.CoverImg === null) {
                    const webBook = await myModels.WebBook.findOne({ where: { BookId: id } });
                    if (!webBook) metadata.CoverImg = "#f2e3a4";
                }

                //删除旧封面文件
                const newCoverImg = metadata.CoverImg?.replace(SHOW_BOOKNAME, "");
                if (newCoverImg != oldCoverImg && oldCoverImg && await fs.promises.stat(path.join(dataPath, oldCoverImg)).catch(() => false)) {
                    await DeleteFile(path.join(dataPath, oldCoverImg));
                    console.log(`[${new Date().toLocaleString()}]\t已删除旧封面文件：${path.join(dataPath, oldCoverImg)}`);
                }
            }

            let rsl = await myModels.Ebook.update(metadata, { where: { id: id } });
            return rsl;
        } catch (err) {
            throw err;
        }
    }

    /**
    * 将指定章节转换为书籍简介
    * @param {number} chapterId - 需要转换的章节ID
    * @returns {Promise<Array>} Sequelize 更新操作结果
    */
    static async Chapter2Introduction(chapterId) {
        const myModels = Models.GetPO();
        let rsl = await myModels.EbookIndex.update({
            Title: Chapter.IntroductionName,
            OrderNum: myModels.sequelize.literal('-ABS(OrderNum)')
        }, {
            where: { id: chapterId }
        });
        return rsl;
    }

    /**
     * 更新书的热度
     * @param {*} bookId 
     */
    static async Heat(bookId) {
        const myModels = Models.GetPO();
        const book = await myModels.Ebook.findByPk(bookId);
        if (book) {
            book.Hotness = (book.Hotness || 0) + 1; // 热度+1
            await book.save();
            return true;
        }
        return false;
    }

    /**
     * 创建一个新卷
     * @param {number} bookId 书籍ID
     * @param {string} title 卷标题
     * @param {string} introduction 卷简介（可选）
     * @returns {Promise<Volume>} 创建的卷对象
     */
    static async CreateVolume(bookId, title, introduction = '') {
        try {
            const myModels = Models.GetPO();
            const t = await myModels.BeginTrans();

            // 获取当前书籍最大卷序号
            const maxOrderNum = await myModels.Volume.max('OrderNum', {
                where: { BookId: bookId },
                transaction: t
            });

            // 创建新卷
            const volume = await myModels.Volume.create({
                BookId: bookId,
                Title: title,
                Introduction: introduction,
                OrderNum: (maxOrderNum || 0) + 1
            }, { transaction: t });

            await t.commit();
            return new Volume(volume.dataValues);
        } catch (err) {
            console.error('创建卷失败:', err);
            throw err;
        }
    }

    /**
     * 更新卷信息
     * @param {number} volumeId 卷ID
     * @param {Object} updates 更新内容
     * @param {string} [updates.title] 新标题
     * @param {string} [updates.introduction] 新简介
     * @returns {Promise<boolean>} 更新是否成功
     */
    static async UpdateVolume(volumeId, { title, introduction }) {
        try {
            const myModels = Models.GetPO();
            const updates = {};

            if (title !== undefined) updates.Title = title;
            if (introduction !== undefined) updates.Introduction = introduction;

            if (Object.keys(updates).length === 0) {
                return true; // 没有需要更新的内容
            }

            const result = await myModels.Volume.update(updates, {
                where: { id: volumeId }
            });

            return result[0] > 0;
        } catch (err) {
            console.error('更新卷失败:', err);
            return false;
        }
    }

    /**
     * 删除卷
     * @param {number} volumeId 卷ID
     * @returns {Promise<boolean>} 删除是否成功
     */
    static async DeleteVolume(volumeId) {
        try {
            const myModels = Models.GetPO();
            const t = await myModels.BeginTrans();

            // 先将卷中的章节移出到书籍根级
            await myModels.EbookIndex.update(
                { VolumeId: null },
                {
                    where: { VolumeId: volumeId },
                    transaction: t
                }
            );

            // 删除卷
            const result = await myModels.Volume.destroy({
                where: { id: volumeId },
                transaction: t
            });

            await t.commit();
            return result > 0;
        } catch (err) {
            console.error('删除卷失败:', err);
            return false;
        }
    }

    /**
     * 获取书籍的所有卷
     * @param {number} bookId 书籍ID
     * @returns {Promise<Volume[]>} 卷列表
     */
    static async GetVolumes(bookId) {
        try {
            const myModels = Models.GetPO();
            const volumes = await myModels.Volume.findAll({
                where: { BookId: bookId },
                order: ['OrderNum']
            });

            return volumes.map(v => new Volume(v.dataValues));
        } catch (err) {
            console.error('获取卷列表失败:', err);
            return [];
        }
    }

    /**
     * 将章节移动到指定卷中
     * @param {number} volumeId 目标卷ID
     * @param {number[]} chapterIds 章节ID列表
     * @returns {Promise<boolean>} 操作是否成功
     */
    static async MoveChaptersToVolume(volumeId, chapterIds) {
        try {
            const myModels = Models.GetPO();
            const result = await myModels.EbookIndex.update(
                { VolumeId: volumeId },
                { where: { id: chapterIds } }
            );

            return result[0] > 0;
        } catch (err) {
            console.error('移动章节到卷失败:', err);
            return false;
        }
    }

    /**
     * 从卷中移除章节（移到书籍根级）
     * @param {number[]} chapterIds 章节ID列表
     * @returns {Promise<boolean>} 操作是否成功
     */
    static async RemoveChaptersFromVolume(chapterIds) {
        try {
            const myModels = Models.GetPO();
            const result = await myModels.EbookIndex.update(
                { VolumeId: null },
                { where: { id: chapterIds } }
            );

            return result[0] > 0;
        } catch (err) {
            console.error('从卷中移除章节失败:', err);
            return false;
        }
    }

    /**
     * 更新卷排序
     * @param {Object[]} volumeOrders 卷排序信息
     * @param {number} volumeOrders[].volumeId 卷ID
     * @param {number} volumeOrders[].orderNum 新排序号
     * @returns {Promise<boolean>} 操作是否成功
     */
    static async UpdateVolumeOrder(volumeOrders) {
        try {
            const myModels = Models.GetPO();
            const t = await myModels.BeginTrans();

            await Promise.all(volumeOrders.map(async (item) => {
                await myModels.Volume.update(
                    { OrderNum: item.orderNum },
                    {
                        where: { id: item.volumeId },
                        transaction: t
                    }
                );
            }));

            await t.commit();
            return true;
        } catch (err) {
            console.error('更新卷排序失败:', err);
            return false;
        }
    }

    /**
     * 获取卷下的所有章节
     * @param {number} volumeId 卷ID
     * @returns {Promise<Chapter[]>} 章节列表
     */
    static async GetVolumeChapters(volumeId) {
        try {
            const myModels = Models.GetPO();
            const chapters = await myModels.EbookIndex.findAll({
                where: { VolumeId: volumeId },
                order: ['OrderNum']
            });

            return chapters.map(c => new Chapter(c.dataValues));
        } catch (err) {
            console.error('获取卷下章节失败:', err);
            return [];
        }
    }
}

