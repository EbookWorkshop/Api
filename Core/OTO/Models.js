const Sequelize = require("sequelize");
const { Op } = require("sequelize");
const EventManager = require("../EventManager");

let PO_MODELS = null;

/**
 * # PO 持久对象(Persistant Object)    
 * 对应数据库中某个表中的一条记录，一个表就是一个类,每张表的字段就是类中的一个属性    
 * __注意；PO中应该不包含任何对数据的操作__
 */
class Models {
    constructor(sequelize) {
        if (PO_MODELS != null) return PO_MODELS;
        /**
         * EBook表对象
         */
        this.Ebook;
        /**
         * 电子书的目录
         */
        this.EbookIndex;

        this.WebBook;
        this.WebBookIndex;
        this.WebBookIndexURL;




        this.InitModels(sequelize); //注意，表当前没同步好

        PO_MODELS = this;
    }

    async InitModels(sequelize) {
        let m = {};
        /**
         * Ebook 部分表
         */
        m.Ebook = sequelize.define("Ebook", {
            BookName: { type: Sequelize.STRING(50), allowNull: false },
            Author: { type: Sequelize.STRING(20), allowNull: true },
            FontFamily: { type: Sequelize.STRING(10), allowNull: false, defaultValue: "微软雅黑" },
            FontSize: { type: Sequelize.INTEGER, defaultValue: 22 },
            CoverImg: { type: Sequelize.STRING(50), allowNull: true },
        });
        //Ebook目录
        m.EbookIndex = sequelize.define("EbookChapter", {
            Title: { type: Sequelize.STRING(50), allowNull: false },                    //章节标题
            Content: { type: Sequelize.TEXT, allowNull: true },                         //章节正文
            OrderNum: { type: Sequelize.INTEGER, allowNull: false },
            HasContent: {
                type: Sequelize.VIRTUAL,        //虚拟字段
                get() {
                    return this.getDataValue("Content")?.length > 0;
                }
            }
        });
        m.Ebook.hasMany(m.EbookIndex, { foreignKey: 'BookId', sourceKey: 'id', as: "EbookIndex" });
        m.EbookIndex.belongsTo(m.Ebook, { foreignKey: 'BookId', targetKey: 'id', as: "Ebook" });


        /**
         * WebBook 部分
         */
        m.WebBook = sequelize.define("WebBook", {
            defaultIndex: { type: Sequelize.INTEGER, defaultValue: 0 },
            WebBookName: { type: Sequelize.STRING(50), allowNull: false },              //网文书名-网文识别合并的唯一标识
            isCheckEnd: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            isCheckRepeat: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        });
        m.Ebook.hasOne(m.WebBook, { foreignKey: 'BookId', sourceKey: 'id' });
        m.WebBook.belongsTo(m.Ebook, { foreignKey: 'BookId', targetKey: 'id' });

        //WebBook来源URL
        m.WebBookIndexSourceURL = sequelize.define("WebBookIndexSourceURL", {   //书目录页URL
            Path: { type: Sequelize.STRING(500), allowNull: true }
        });
        m.WebBook.hasMany(m.WebBookIndexSourceURL);
        m.WebBookIndexSourceURL.belongsTo(m.WebBook);

        //WebBook目录
        m.WebBookIndex = sequelize.define("WebBookChapter", {
            WebTitle: { type: Sequelize.STRING(50), allowNull: false }                  //网文章节标题-网文合并的唯一标识
        });
        m.EbookIndex.hasOne(m.WebBookIndex, { foreignKey: 'IndexId', sourceKey: 'id', as: "WebBookIndex" });
        m.WebBookIndex.belongsTo(m.EbookIndex, { foreignKey: 'IndexId', targetKey: 'id', as: "EbookIndex" });
        // m.WebBook.hasMany(m.WebBookIndex, { foreignKey: 'BookId', sourceKey: 'BookId' });
        // m.WebBookIndex.belongsTo(m.WebBook, { foreignKey: 'BookId', targetKey: 'BookId' });

        m.WebBookIndexURL = sequelize.define("WebBookIndexURL", {   //每一章的地址
            Path: { type: Sequelize.STRING(500), allowNull: false }
        });
        m.WebBookIndex.hasMany(m.WebBookIndexURL, { foreignKey: "WebBookIndexId", sourceKey: "id" });
        m.WebBookIndexURL.belongsTo(m.WebBookIndex, { foreignKey: 'WebBookIndexId', targetKey: "id" });

        m.PDFBook = sequelize.define("PDFBook", {
            PaddingX: { type: Sequelize.INTEGER, allowNull: false },
            PaddingY: { type: Sequelize.INTEGER, allowNull: false },
            PageWidth: { type: Sequelize.INTEGER, allowNull: false },
            IsShowTitleOnChapter: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        });
        m.Ebook.hasOne(m.PDFBook, { foreignKey: 'BookId', sourceKey: 'id' });
        m.PDFBook.belongsTo(m.Ebook, { foreignKey: 'BookId', targetKey: 'id' });

        //网站规则部分
        m.RuleForWeb = sequelize.define("RuleForWeb", {   //每一章的地址
            Host: { type: Sequelize.STRING(100), allowNull: false },
            RuleName: { type: Sequelize.STRING(20), allowNull: false },
            Selector: { type: Sequelize.STRING(100), allowNull: false },
            RemoveSelector: { type: Sequelize.STRING(200), allowNull: true },
            GetContentAction: { type: Sequelize.STRING(100), allowNull: true },
            GetUrlAction: { type: Sequelize.STRING(100), allowNull: true },
            Type: { type: Sequelize.STRING(100), allowNull: false, defaultValue: "Object" },
            CheckSetting: { type: Sequelize.STRING(100), allowNull: true },
        });

        // this.RuleForWeb = sequelize.define("RuleForWeb", {   //每一章的地址
        // });

        //系统配置项表
        m.SystemConfig = sequelize.define("SystemConfig", {
            Group: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "default" },     //配置分组
            Name: { type: Sequelize.STRING(20), allowNull: false },      //配置名称
            Value: { type: Sequelize.STRING(500), allowNull: false },   //配置值
            RealDataType: { type: Sequelize.STRING(10), allowNull: true },  //真实的值类型
        });


        //校阅规则配置表
        m.ReviewRule = sequelize.define("ReviewRule", {
            Name: { type: Sequelize.STRING(20), allowNull: false },      //配置名称
            Rule: { type: Sequelize.STRING(100), allowNull: true },      //查找规则、查找串
            Replace: { type: Sequelize.STRING(20), allowNull: true },      //真实的值类型
        });
        //哪本书在用
        m.ReviewRuleUsing = sequelize.define("ReviewRuleUsing", {
        });
        // m.ReviewRuleUsing.hasMany(m.ReviewRule, { foreignKey: 'RuleId', sourceKey: 'id' });
        // m.ReviewRuleUsing.hasMany(m.Ebook, { foreignKey: 'BookId', sourceKey: 'id' });
        m.Ebook.hasMany(m.ReviewRuleUsing, { foreignKey: 'BookId', sourceKey: 'id' });
        m.ReviewRule.hasMany(m.ReviewRuleUsing, { foreignKey: 'RuleId', sourceKey: 'id' });
        m.ReviewRuleUsing.belongsTo(m.Ebook, { foreignKey: 'BookId', targetKey: 'id' });
        m.ReviewRuleUsing.belongsTo(m.ReviewRule, { foreignKey: 'RuleId', targetKey: 'id' });



        await sequelize.sync();     //同步所有模型
        for (var n in m) {
            this[n] = m[n];
        }
        new EventManager().emit("DB.Models.Init");
    }

    static GetPO() {
        return PO_MODELS;
    }

    static get Op() {
        return Op;
    }
}

module.exports = Models;