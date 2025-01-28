const { readdir } = require('node:fs/promises');
const path = require("path");
const EventManager = require("../../EventManager");
const Models = require("./../Models");
const Index = require("./../../../Entity/Ebook/Index");
const Chapter = require("./../../../Entity/Ebook/Chapter");
const Reviewer = require("./../../Utils/RuleReview");

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
         * 重新加载所有章节
         */
        ebook.ReloadIndex = async () => {
            const myModels = new Models();
            let eIndexs = await myModels.EbookIndex.findAll({ where: { BookId: ebook.BookId }, order: ["OrderNum"] });
            for (let i of eIndexs) {
                let index = new Index({ ...i.dataValues, HasContent: i.HasContent })
                ebook.Index.push(index);
            }
        }

        /**
         * 从数据库加载指定章节到当前对象
         * @param {*} cId 章节ID
         */
        ebook.ReloadChapter = async (cId) => {
            let ebookIndex = await new Models().EbookIndex.findOne({ where: { id: cId, BookId: ebook.BookId } });
            if (ebookIndex == null) return;
            let cp = new Chapter({ ...ebookIndex.dataValues });
            // if (cp.Content) 
            ebook.Chapters.set(cp.Title, cp);
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
                ebook.Chapters.set(curContent.Title, curContent);
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

        await ebook.ReloadIndex();

        return ebook;
    }


    /**
     * 删除书，目前会同时删除Ebook、WebBook
     * TODO: 删除其它格式的数据 如PDF
     * @param {*} bookId 书ID
     */
    static async DeleteOneBook(bookId) {
        const myModels = new Models();

        //取得eBook
        const ebook = await myModels.Ebook.findOne({ where: { id: bookId } });
        if (ebook == null) return;
        const index = await ebook.getEbookIndex();

        //取得WebBook
        const wbook = await ebook.getWebBook();
        const wbSourceUrl = await wbook?.getWebBookIndexSourceURLs();

        //开始删除
        for (let i of index) {
            if (wbook) {
                const eIndex = await i.getWebBookIndex();
                if (eIndex !== null) {
                    const eIUrl = await eIndex.getWebBookIndexURLs() || [];
                    for (let ei of eIUrl) {
                        await ei.destroy();
                    }
                    await eIndex.destroy();
                }
            }
            await i.destroy();
        }
        for (let wu of wbSourceUrl ?? []) {
            await wu.destroy();
        }
        await wbook?.destroy();
        await ebook.destroy();
    }

}

/**
 * 用于获取默认会有的那些类方法，自动覆盖的时候不包含这些
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