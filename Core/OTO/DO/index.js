const { readdir } = require('node:fs/promises');
const path = require("path");
const EventManager = require("../../EventManager");
const Models = require("../Models");
const Index = require("./../../../Entity/Ebook/Index");
const Chapter = require("./../../../Entity/Ebook/Chapter");
const { Run: Reviewer } = require("./../../Utils/ReviewString");
const { dataPath } = require("../../../config");

/**
 * # 初始化
 */

//数据库操作文档 https://www.sequelize.cn/

/**
 * # PoToDo、DoToPo
 * 将实体类和数据库类互转
 */
class DO {

    /**
     * # Po to Do
     * @param {*} ebookModel PO
     * @param {Ebook|WebBook|PDFBook} BOOKTYPE 需要创建的类，如`Ebook`、`WebBook`、`PDFBook`
     * @returns {BOOKTYPE} 
     */
    static async ModelToBookObj(ebookModel, BOOKTYPE) {
        // const myModels = new Models();
        let ebook = new BOOKTYPE({ ...ebookModel.dataValues });

        /**
         * [LoadIndex]重新加载所有章节
         */
        ebook.ReloadIndex = async () => {
            const myModels = new Models();
            let eIndexs = await myModels.EbookIndex.findAll({ where: { BookId: ebook.BookId, OrderNum: { [Models.Op.gte]: 0 } }, order: ["OrderNum"] });
            for (let i of eIndexs) {
                let index = new Index({ ...i.dataValues, HasContent: i.HasContent })
                ebook.Index.push(index);
            }
        }

        /**
         * 从数据库加载指定章节到当前对象
         * @param {number} cId 章节ID
         * @returns {Chapter|null}   返回已加载的章节内容
         */
        ebook.ReloadChapter = async (cId) => {
            let ebookIndex = await new Models().EbookIndex.findOne({ where: { id: cId, BookId: ebook.BookId } });
            if (ebookIndex == null) return null;
            let cp = new Chapter({ ...ebookIndex.dataValues });
            // if (cp.Content) 
            ebook.Chapters.set(cp.Title, cp);
            return cp;
        }

        /**
         * 拿到指定章节内容
         * @param {*} cId 章节ID
         */
        ebook.GetChapter = (cId) => {
            let iObj = ebook.Index.filter(i => i.IndexId === cId);
            if (iObj.length <= 0) return null;
            return ebook.Chapters.get(iObj[0].Title);
        }

        /**
         * 设置并存储
         * @param {*} path 
         */
        ebook.SetCoverImg = async (path) => {
            ebookModel.CoverImg = path;
            await ebookModel.save();
        }

        /**
         * 初始化校阅规则
         */
        ebook.InitReviewRules = async () => {
            if (ebook.ReviewRules != null) return;
            ebook.ReviewRules = await DO.GetReviewRules(ebook.BookId);
        }

        /**
         * 校正指定章节
         * @param {*} chapterId 要校阅的章节ID，为空则全部章节校阅
         * @returns 
         */
        ebook.ReviewChapter = async (chapterId) => {
            let RC = async (cId) => {
                let iObj = ebook.Index.filter(i => i.IndexId === cId);
                if (iObj.length <= 0) return null;
                let curContent = ebook.Chapters.get(iObj[0].Title);
                if (curContent === undefined) return null;

                ebook.Chapters.delete(iObj[0].Title);
                [curContent.Title, curContent.Content] = Reviewer(ebook.ReviewRules, [curContent.Title, curContent.Content]);
                ebook.Chapters.set(iObj[0].Title, curContent);//ebook.Chapters 通过Title索引文章，不能用整理后的，否则会找不到数据
            }

            if (ebook.ReviewRules == null) await ebook.InitReviewRules();
            if (chapterId === undefined) {
                for (let idx of ebook.Index) {
                    await RC(idx.IndexId);
                }
            } else {
                await RC(chapterId);
            }

        }

        /**
         * 设置包含的章节
         * 章节内容已校阅
         * @param {Array<number>} chapters 需要的章节Id
         */
        ebook.SetShowChapters = async (chapters) => {
            for (let c of chapters) {
                if (ebook.showIndexId.has(c)) continue;
                await ebook.ReloadChapter(c);
                await ebook.ReviewChapter(c);
                ebook.showIndexId.add(c);
            }
        }

        /**
         * 拿到最大的章节排序号
         * @returns {number} 最大章节序号
         */
        ebook.GetMaxIndexOrder = async () => {
            const myModels = Models.GetPO();
            let lastIndex = await myModels.EbookIndex.findOne({ where: { BookId: ebook.BookId }, order: [["OrderNum", "DESC"]] });
            return lastIndex?.OrderNum || 1;
        }
        await ebook.ReloadIndex();

        /**
         * 加载书籍简介
         */
        ebook.LoadIntroduction = async () => {
            const myModels = Models.GetPO();
            const intro = await myModels.EbookIndex.findOne({
                where: {
                    BookId: ebook.BookId,
                    Title: Chapter.IntroductionName
                }
            });
            if (intro) {
                ebook.Introduction = intro.Content;
            }
        }

        return ebook;
    }


    /**
     * 删除书，目前会同时删除Ebook、WebBook
     * TODO: 删除其它格式的数据 如PDF
     * @param {*} bookId 书ID
     */
    static async DeleteOneBook(bookId, deleteCover = true) {
        const myModels = new Models();
        // await myModels.ReviewRuleUsing.destroy({ where: { BookId: bookId } });

        //取得eBook
        const ebook = await myModels.Ebook.findOne({ where: { id: bookId } });
        try {
            let CoverImg = ebook.CoverImg;
            if (deleteCover && CoverImg != null && !CoverImg.startsWith("#")) {
                const fs = require("fs/promises");
                let thisCoverImg = path.join(dataPath, CoverImg);
                await fs.unlink(thisCoverImg);
                let imgDir = path.dirname(thisCoverImg);
                await fs.rmdir(imgDir);
            }
        } catch (err) {
            console.error("删除封面出错：", err);
        }

        //删除书本
        await ebook.destroy();
    }
}

/**
 * 用于获取默认会有的那些类方法，自动覆盖的时候不包含这些
 * 用空类获得类默认带有的方法，用于排除这些自带方法避免反复添加
 * 如果有其它不需要的方法也能加入这类中，用于做黑名单
 */
class MethodNotInclude {
}


AutoInit();

/**
 * 自动加载/加载当前文件夹里的*.js文件
 */
function AutoInit() {
    if (DO.HAS_INIT) return;
    const em = new EventManager();
    readdir(__dirname).then(fileList => {
        // console.log(result);

        const notIncludeMethod = Object.getOwnPropertyNames(MethodNotInclude);

        for (let file of fileList) {
            if (file === "index.js" || !file.endsWith(".js")) continue;
            // const FILE_NAME = file.replace(".js", "");
            const CLASS = require(path.join(__dirname, file));        //按文件装模型

            Object.getOwnPropertyNames(CLASS).forEach(methodName => {
                if (notIncludeMethod.includes(methodName)) return;
                DO[methodName] = CLASS[methodName];
            });
        }

        DO.HAS_INIT = true;

    }).catch(err => {
        em.emit("Debug.Log", "装载DO方法失败", "DO", err);
    });

}

// const handler = {
//     get: function(target, prop, receiver) {
//         if (typeof target[prop] === 'function') {
//             console.log(`Calling ${prop}`);
//             return function(...args) {
//                 console.log(`Arguments: ${args.join(', ')}`);
//                 const result = target[prop].apply(this, args);
//                 console.log(`Result: ${result}`);
//                 return result;
//             };
//         }
//         return Reflect.get(target, prop, receiver);
//     }
// };
// const DOProxy = new Proxy(DO, handler);
module.exports = DO;//如果需要监控调用情况，就导出DOProxy代替