/**
 * 字符分析统计
 */
class SmartCharacterAnalyzer {
    constructor() {
        // 定义常见字符区块（这些区块的字符通常不会被认为是"异常"）
        this.commonBlocks = new Set([
            'CJK Unified Ideographs',           // 基本汉字 (U+4E00-U+9FFF)
            'CJK Unified Ideographs Extension', // 扩展汉字
            'Basic Latin',                      // 基本拉丁字母 (U+0000-U+007F)
            'Latin-1 Supplement',               // 拉丁字母补充 (U+0080-U+00FF)
            'General Punctuation',              // 通用标点
            'CJK Symbols and Punctuation',      // CJK标点符号
            'Full Width Forms',                 // 全角字符
            'Half Width Forms',                 // 半角字符
            'Numbers',                          // 数字
        ]);

        // 定义可疑字符区块（这些区块的字符通常需要特别注意）
        this.suspiciousBlocks = new Set([
            'CJK Compatibility',                // CJK兼容字符
            'CJK Compatibility Ideographs',     // CJK兼容表意字符
            'CJK Compatibility Forms',          // CJK兼容形式
            'Kangxi Radicals',                  // 康熙部首
            'CJK Radicals Supplement',          // 部首补充
            'Private Use Area',                 // 私有区域
            'Variation Selectors',              // 变体选择符
            'Enclosed Alphanumerics',           // 包围字母数字
            'Enclosed CJK Letters and Months',  // 包围CJK文字和月份
        ]);

        this.specialChars = {
            0x2028: { en: 'Line Separator', zh: '行分隔符' },
            0x2029: { en: 'Paragraph Separator', zh: '段落分隔符' },
            0x0085: { en: 'Next Line', zh: '下一行' },
            0x200C: { en: 'Zero Width Non-Joiner', zh: '零宽非连接符' },
            0x200D: { en: 'Zero Width Joiner', zh: '零宽连接符' },
            0x200E: { en: 'Left-To-Right Mark', zh: '左至右标记' },
            0x200F: { en: 'Right-To-Left Mark', zh: '右至左标记' },
            0x2029: { en: 'Paragraph Separator', zh: '段落分隔符' },
            0x202A: { en: 'Left-To-Right Embedding', zh: '左至右嵌入' },
            0x202B: { en: 'Right-To-Left Embedding', zh: '右至左嵌入' },
            0x202C: { en: 'Pop Directional Formatting', zh: '弹出方向格式化' },
            0x202D: { en: 'Left-To-Right Override', zh: '左至右覆盖' },
            0x202E: { en: 'Right-To-Left Override', zh: '右至左覆盖' },
            0x2060: { en: 'Word Joiner', zh: '词连接符' },
        };
    }

    /**
     * 获取字符的Unicode区块信息
     */
    getUnicodeBlock(char) {
        const codePoint = char.codePointAt(0);

        // Unicode区块范围定义
        const blocks = [
            { name: 'Basic Latin', start: 0x0000, end: 0x007F },
            { name: 'CJK Compatibility', start: 0xF900, end: 0xFAFF },
            { name: 'CJK Compatibility Forms', start: 0xFE30, end: 0xFE4F },
            { name: 'CJK Compatibility Ideographs', start: 0xF900, end: 0xFAFF },
            { name: 'Kangxi Radicals', start: 0x2F00, end: 0x2FDF },
            { name: 'CJK Radicals Supplement', start: 0x2E80, end: 0x2EFF },
            { name: 'CJK Unified Ideographs', start: 0x4E00, end: 0x9FFF },
            { name: 'Private Use Area', start: 0xE000, end: 0xF8FF },
            { name: 'CJK Symbols and Punctuation', start: 0x3000, end: 0x303F },
            { name: 'General Punctuation', start: 0x2000, end: 0x206F },
            { name: 'Full Width Forms', start: 0xFF00, end: 0xFFEF },
            { name: 'Half Width Forms', start: 0xFF00, end: 0xFFEF },
        ];

        for (const block of blocks) {
            if (codePoint >= block.start && codePoint <= block.end) {
                return block.name;
            }
        }

        return 'Other';
    }

    /**
     * 分析文本中的字符使用频率
     */
    analyzeCharacterFrequency(text) {
        const freqMap = new Map();

        for (const char of text) {
            if (char.trim() === '') continue; // 跳过空格

            const block = this.getUnicodeBlock(char);
            freqMap.set(char, (freqMap.get(char) || 0) + 1);
        }

        return freqMap;
    }

    /**
     * 检测可疑字符
     */
    detectSuspiciousCharacters(text) {
        const charMap = new Map(); // 使用Map来存储每个字符的结果
        const freqMap = this.analyzeCharacterFrequency(text);

        // 计算总字符数（非空格）
        const totalChars = Array.from(freqMap.values()).reduce((sum, count) => sum + count, 0);

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const charCodePoint = char.codePointAt(0);
            if (char.trim() === '') continue;

            const block = this.getUnicodeBlock(char);
            const frequency = freqMap.get(char);
            const frequencyPercent = (frequency / totalChars) * 100;

            // 检测逻辑
            let suspicionLevel = 0;
            let reasons = [];

            // 规则1: 字符位于可疑区块
            if (this.suspiciousBlocks.has(block)) {
                suspicionLevel += 3;
                reasons.push(`位于可疑Unicode区块: ${block}`);
            }

            // // 规则2: 字符频率极低（在全文出现次数很少）
            // if (frequency === 1 && totalChars > 100) {
            //     suspicionLevel += 2;
            //     reasons.push('在全文仅出现一次');
            // } else if (frequencyPercent < 0.01 && totalChars > 500) {
            //     suspicionLevel += 1;
            //     reasons.push('出现频率极低');
            // }

            // 规则3: 字符不在常见区块
            if (!this.commonBlocks.has(block) && !this.suspiciousBlocks.has(block)) {
                suspicionLevel += 1;
                reasons.push(`位于非常见区块: ${block}`);
            }

            // 规则4: 私有区域字符（通常是字体图标等）
            if (block === 'Private Use Area') {
                suspicionLevel += 4;
                reasons.push('位于私有使用区域（可能显示异常）');
            }

            // 规则5: 标点符号区不可见字符
            if (block === 'General Punctuation' && this.specialChars[charCodePoint]) {
                suspicionLevel += 2;
                reasons.push(`位于不可见标点符号区: ${this.specialChars[charCodePoint].en}`);
            }

            if (suspicionLevel >= 2) {
                const start = Math.max(0, i - 15);
                const end = Math.min(text.length, i + 15);
                const context = text.slice(start, end).replace(/\n/g, '\\n');

                // 检查字符是否已经在Map中
                if (charMap.has(char)) {
                    // 合并现有结果
                    const existing = charMap.get(char);

                    // 合并reasons并去重
                    const reasonSet = new Set([...existing.reasons, ...reasons]);
                    existing.reasons = Array.from(reasonSet);

                    // 合并context
                    existing.context.push(context);

                    // 更新最高可疑度（如果当前字符的可疑度更高）
                    if (suspicionLevel > existing.suspicionLevel) {
                        existing.suspicionLevel = suspicionLevel;
                    }

                    charMap.set(char, existing);
                } else {
                    // 创建新结果
                    charMap.set(char, {
                        character: char,
                        codePoint: `U+${charCodePoint.toString(16).toUpperCase().padStart(4, '0')}`,
                        unicodeBlock: block,
                        suspicionLevel: suspicionLevel,
                        frequency: frequency,
                        frequencyPercent: frequencyPercent.toFixed(3),
                        reasons: reasons,
                        context: [context] // 使用数组存储所有上下文
                    });
                }
            }
        }

        // 将Map转换为数组并按可疑程度排序
        const results = Array.from(charMap.values());

        // 对context数组进行处理，连接成字符串或保留为数组
        // 这里选择保留为数组，以便调用者可以灵活处理

        return results.sort((a, b) => b.suspicionLevel - a.suspicionLevel);
    }

    /**
     * 生成字符使用报告
     */
    generateReport(text) {
        const freqMap = this.analyzeCharacterFrequency(text);
        const totalUniqueChars = freqMap.size;
        const totalChars = Array.from(freqMap.values()).reduce((sum, count) => sum + count, 0);

        // 按区块统计
        const blockStats = new Map();
        for (const [char, count] of freqMap) {
            const block = this.getUnicodeBlock(char);
            blockStats.set(block, (blockStats.get(block) || 0) + count);
        }

        return {
            totalCharacters: totalChars,
            totalUniqueCharacters: totalUniqueChars,
            blockStatistics: Array.from(blockStats.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([block, count]) => ({
                    block,
                    count,
                    percentage: ((count / totalChars) * 100).toFixed(2) + '%'
                }))
        };
    }
}

module.exports = SmartCharacterAnalyzer;