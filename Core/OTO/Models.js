const Sequelize = require("sequelize");
const EventManager = require("../EventManager");

let PO_MODELS = null;//PO对象

/**
 * # PO 持久对象(Persistant Object)    
 * 对应数据库中某个表中的一条记录，一个表就是一个类,每张表的字段就是类中的一个属性    
 * __注意；PO中应该不包含任何对数据的操作__
 */
class Models {
    constructor(sequelizeConnect) {
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




        this.InitModels(sequelizeConnect); //注意，表当前没同步好

        PO_MODELS = this;
    }

    async InitModels(sqlConnect) {
        let m = {};
        /**
         * Ebook 部分表
         */
        m.Ebook = sqlConnect.define("Ebook", {
            BookName: { type: Sequelize.STRING(50), allowNull: false },
            Author: { type: Sequelize.STRING(20), allowNull: true },
            FontFamily: { type: Sequelize.STRING(10), allowNull: false, defaultValue: "微软雅黑" },
            FontSize: { type: Sequelize.INTEGER, defaultValue: 22 },
            CoverImg: { type: Sequelize.STRING(50), allowNull: true },
        });
        //Ebook目录
        m.EbookIndex = sqlConnect.define("EbookChapter", {
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
        m.WebBook = sqlConnect.define("WebBook", {
            defaultIndex: { type: Sequelize.INTEGER, defaultValue: 0 },
            WebBookName: { type: Sequelize.STRING(50), allowNull: false },              //网文书名-网文识别合并的唯一标识
            isCheckEnd: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            isCheckRepeat: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        });
        m.Ebook.hasOne(m.WebBook, { foreignKey: 'BookId', sourceKey: 'id' });
        m.WebBook.belongsTo(m.Ebook, { foreignKey: 'BookId', targetKey: 'id' });

        //WebBook来源URL
        m.WebBookIndexSourceURL = sqlConnect.define("WebBookIndexSourceURL", {   //书目录页URL
            Path: { type: Sequelize.STRING(500), allowNull: true }
        });
        m.WebBook.hasMany(m.WebBookIndexSourceURL);
        m.WebBookIndexSourceURL.belongsTo(m.WebBook);

        //WebBook目录
        m.WebBookIndex = sqlConnect.define("WebBookChapter", {
            WebTitle: { type: Sequelize.STRING(50), allowNull: false }                  //网文章节标题-网文合并的唯一标识
        });
        m.EbookIndex.hasOne(m.WebBookIndex, { foreignKey: 'IndexId', sourceKey: 'id', as: "WebBookIndex" });
        m.WebBookIndex.belongsTo(m.EbookIndex, { foreignKey: 'IndexId', targetKey: 'id', as: "EbookIndex" });
        // m.WebBook.hasMany(m.WebBookIndex, { foreignKey: 'BookId', sourceKey: 'BookId' });
        // m.WebBookIndex.belongsTo(m.WebBook, { foreignKey: 'BookId', targetKey: 'BookId' });

        m.WebBookIndexURL = sqlConnect.define("WebBookIndexURL", {   //每一章的地址
            Path: { type: Sequelize.STRING(500), allowNull: false }
        });
        m.WebBookIndex.hasMany(m.WebBookIndexURL, { foreignKey: "WebBookIndexId", sourceKey: "id" });
        m.WebBookIndexURL.belongsTo(m.WebBookIndex, { foreignKey: 'WebBookIndexId', targetKey: "id" });

        m.PDFBook = sqlConnect.define("PDFBook", {
            PaddingX: { type: Sequelize.INTEGER, allowNull: false },
            PaddingY: { type: Sequelize.INTEGER, allowNull: false },
            PageWidth: { type: Sequelize.INTEGER, allowNull: false },
            IsShowTitleOnChapter: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        });
        m.Ebook.hasOne(m.PDFBook, { foreignKey: 'BookId', sourceKey: 'id' });
        m.PDFBook.belongsTo(m.Ebook, { foreignKey: 'BookId', targetKey: 'id' });

        //网站规则部分
        m.RuleForWeb = sqlConnect.define("RuleForWeb", {   //每一章的地址
            Host: { type: Sequelize.STRING(100), allowNull: false },
            RuleName: { type: Sequelize.STRING(20), allowNull: false },
            Selector: { type: Sequelize.STRING(100), allowNull: false },
            RemoveSelector: { type: Sequelize.STRING(200), allowNull: true },
            GetContentAction: { type: Sequelize.STRING(100), allowNull: true },
            GetUrlAction: { type: Sequelize.STRING(100), allowNull: true },
            Type: { type: Sequelize.STRING(100), allowNull: false, defaultValue: "Object" },
            CheckSetting: { type: Sequelize.STRING(100), allowNull: true },         //用于进一步校验的配置
        });

        // this.RuleForWeb = sequelize.define("RuleForWeb", {   //每一章的地址
        // });

        //系统配置项表
        m.SystemConfig = sqlConnect.define("SystemConfig", {
            Group: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "default" },     //配置分组
            Name: { type: Sequelize.STRING(20), allowNull: false },      //配置名称
            Value: { type: Sequelize.STRING(500), allowNull: false },   //配置值
            RealDataType: { type: Sequelize.STRING(10), allowNull: true },  //真实的值类型
        });


        //校阅规则配置表
        m.ReviewRule = sqlConnect.define("ReviewRule", {
            Name: { type: Sequelize.STRING(20), allowNull: false },      //配置名称
            Rule: { type: Sequelize.STRING(100), allowNull: true },      //查找规则、查找串
            Replace: { type: Sequelize.STRING(20), allowNull: true },      //真实的值类型
        });
        //哪本书在用
        m.ReviewRuleUsing = sqlConnect.define("ReviewRuleUsing", {
        });
        // m.ReviewRuleUsing.hasMany(m.ReviewRule, { foreignKey: 'RuleId', sourceKey: 'id' });
        // m.ReviewRuleUsing.hasMany(m.Ebook, { foreignKey: 'BookId', sourceKey: 'id' });
        m.Ebook.hasMany(m.ReviewRuleUsing, { foreignKey: 'BookId', sourceKey: 'id' });
        m.ReviewRule.hasMany(m.ReviewRuleUsing, { foreignKey: 'RuleId', sourceKey: 'id' });
        m.ReviewRuleUsing.belongsTo(m.Ebook, { foreignKey: 'BookId', targetKey: 'id' });
        m.ReviewRuleUsing.belongsTo(m.ReviewRule, { foreignKey: 'RuleId', targetKey: 'id' });



        await sqlConnect.sync();     //同步所有模型
        for (var n in m) {
            this[n] = m[n];
        }
        new EventManager().emit("DB.Models.Init",sqlConnect.options.storage);
    }

    static GetPO() {
        return PO_MODELS;
    }

    /**
     * Sequelize的操作符
     * Op.and：逻辑 AND 操作符，用于组合多个条件，所有条件必须同时满足。
     * Op.or：逻辑 OR 操作符，用于组合多个条件，至少有一个条件满足即可。
     * Op.gt：大于（Greater Than）操作符，用于数值比较。
     * Op.gte：大于等于（Greater Than or Equal）操作符。
     * Op.lt：小于（Less Than）操作符。
     * Op.lte：小于等于（Less Than or Equal）操作符。
     * Op.ne：不等于（Not Equal）操作符。
     * Op.eq：等于（Equal）操作符。
     * Op.not：逻辑 NOT 操作符，用于否定某个条件。
     * Op.between：介于两个值之间（Between）操作符。
     * Op.notBetween：不介于两个值之间操作符。
     * Op.in：在给定数组中的值（In）操作符。
     * Op.notIn：不在给定数组中的值（Not In）操作符。
     * Op.like：模糊匹配（Like）操作符，用于字符串匹配。
     * Op.notLike：不模糊匹配（Not Like）操作符。
     * Op.iLike：不区分大小写的模糊匹配（ILike）操作符，仅限 PostgreSQL。
     * Op.regexp：正则表达式匹配（Regexp）操作符，仅限 MySQL/PostgreSQL。
     * Op.notRegexp：不匹配正则表达式（Not Regexp）操作符。
     * Op.iRegexp：不区分大小写的正则表达式匹配（IRegexp）操作符，仅限 PostgreSQL。
     * Op.notIRegexp：不区分大小写的不匹配正则表达式（Not IRegexp）操作符。
     */
    static get Op() {
        return Sequelize.Op;
    }
}

module.exports = Models;