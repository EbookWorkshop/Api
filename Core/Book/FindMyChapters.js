/**
 * 查找指定书籍的指定章节
 * # 先判断volumes，不为空则按卷生成书；若空则按showChapters生成指定章节；若showChapters也为空则按生成全书
 * @param {Ebook} ebook 书籍对象
 * @param {Array<number>?} volumes 要显示的卷ID数组
 * @param {Array<number>?} showChapters 要显示的章节ID数组
 * @returns {Promise<Array<Chapter>>} 章节数组
 */
function FindMyChapters(ebook, volumes, showChapters) {
    if (volumes && volumes.length > 0) {
        return ebook.Index.filter(item => volumes.includes(item.VolumeId)).map(item => item.IndexId);
    }
    if (showChapters && showChapters.length > 0) {
        return showChapters;
    }
    return ebook.Index.map(item => item.IndexId);
}

module.exports = FindMyChapters;
