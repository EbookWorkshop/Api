const Models = require("./../../Core/OTO/Models");


/**
 * @returns 已登记所有网站主机名
 */
async function ListRegisteredWebsitesHost() {
    const myModels = new Models();
    const hosts = await myModels.RuleForWeb.findAll({
        attributes: [[myModels.sequelize.fn('DISTINCT', myModels.sequelize.col('Host')), 'Host']],//使用attributes参数只查询Host字段
        raw: true
    });
    return hosts.map(item => item.Host);
}

/**
 * @returns 已登记的所有站点的统计信息
 */
async function ListRegisteredWebsitesInfo() {
    const myModels = new Models();
    //已登记的站点
    const hosts = await myModels.RuleForWeb.findAll({
        attributes: [[myModels.sequelize.fn('DISTINCT', myModels.sequelize.col('Host')), 'Host']],
        raw: true
    });

    //在书库中的使用情况
    const result = [];
    for (const item of hosts) {
        const host = item.Host;

        const tableName = typeof myModels.WebBookIndexSourceURL.getTableName === 'function'
            ? myModels.WebBookIndexSourceURL.getTableName()
            : (myModels.WebBookIndexSourceURL.tableName || 'WebBookIndexSourceURLs');
        const escapedHost = host.replace(/'/g, "''");

        /*
        DECLARE @host NVARCHAR(256) = N'example.com';
        SELECT
            wbi.[WebBookId],
            wb.[BookId] AS [WebBook.BookId],
            eb.[id] AS [WebBook.Ebook.id],
            eb.[BookName] AS [WebBook.Ebook.BookName],
            (
                SELECT MAX(s.[createdAt])
                FROM [WebBookIndexSourceURLs] s
                WHERE s.[Path] LIKE '%' + @host + '%'
            ) AS [MaxCreatedAt]
        FROM [WebBookIndexSourceURLs] wbi
        LEFT JOIN [WebBooks] wb ON wb.[id] = wbi.[WebBookId]
        LEFT JOIN [Ebooks] eb ON eb.[id] = wb.[BookId]
        WHERE wbi.[Path] LIKE '%' + @host + '%';
        */
        const rows = await myModels.WebBookIndexSourceURL.findAll({
            where: { Path: { [Models.Op.like]: `%${host}%` } },
            include: [{
                model: myModels.WebBook,
                attributes: ['BookId'],
                include: [{ model: myModels.Ebook, attributes: ['id', 'BookName'] }]
            }],
            attributes: [
                'WebBookId',
                [myModels.sequelize.literal(
                    `(SELECT MAX("createdAt") FROM "${tableName}" s WHERE s."Path" LIKE '%${escapedHost}%')`
                ), 'MaxCreatedAt']
            ],
            raw: true
        });

        let maxCreatedAt = null;
        if (rows && rows.length > 0) {
            maxCreatedAt = rows[0].MaxCreatedAt || null;
        }

        const bookMap = new Map();
        for (const r of rows) {
            const bookId = r['WebBook.BookId'] || r.BookId;
            const bookName = r['WebBook.Ebook.BookName'] || null;
            if (bookId && !bookMap.has(bookId)) bookMap.set(bookId, bookName);
        }

        result.push({
            Host: host,
            BookCount: bookMap.size,
            LastAddedTime: maxCreatedAt,
            Books: Array.from(bookMap.entries()).map(([BookId, BookName]) => ({ BookId, BookName })),
        });
    }
    return result;
}

module.exports = {
    ListRegisteredWebsitesHost,
    ListRegisteredWebsitesInfo,
}