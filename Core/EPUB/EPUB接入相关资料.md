# EPUB 接入的一些笔记
摘录于：https://github.com/cyrilis/epub-gen/blob/master/README.md
## 用法

安装库并将其添加为依赖项（推荐），在你的项目目录中运行：

	npm install epub-gen --save

然后在你的代码中加入以下内容：

```javascript
    const EPUB = require("epub-gen");

    new EPUB(option [, output]).promise.then(
        () => console.log("电子书生成成功！"),
	err => console.error("由于 ", err, " 生成电子书失败")
    );
```

#### 选项

- `title`:    书籍标题
- `author`:    书籍作者的名字，字符串或数组，例如 `"Alice"` 或 `["Alice", "Bob"]`
- `publisher`:    出版社名称（可选）
- `cover`:    书籍封面图像（可选），文件路径（绝对路径）或网络 URL，例如 `"http://abc.com/book-cover.jpg"` 或 `"/User/Alice/images/book-cover.jpg"`
- `output`:    输出路径（绝对路径），你也可以在使用 `new` 时将输出路径作为第二个参数传递，例如：`new EPUB(options, output)`
- `version`:    你可以指定生成的 EPUB 版本，`3` 是最新版本（ http://idpf.org/epub/30 ）或 `2` 是之前的版本（ http://idpf.org/epub/201 ，兼容性更好）。如果未指定，将默认为 `3`。
- `css`:    如果你不喜欢我们的 CSS，你可以传递 CSS 字符串来替换我们的默认样式。例如：`"body{background: #000}"`
- `fonts`:    包含在书籍中的自定义字体的路径数组，以便它们可以在自定义 CSS 中使用。例如：如果你将数组配置为 `fonts: ['/path/to/Merriweather.ttf']`，你可以在自定义 CSS 中使用以下内容：

    ```
    @font-face {
        font-family: "Merriweather";
        font-style: normal;
        font-weight: normal;
        src : url("./fonts/Merriweather.ttf");
    }
    ```
- `lang`:    书籍的语言代码（可选）。如果未指定，将默认为 `en`。
- `tocTitle`:    目录的标题。如果未指定，将默认为 `Table Of Contents`。
- `appendChapterTitles`:    自动在每个内容的开头附加章节标题。你可以通过指定 `false` 来禁用它。
- `customOpfTemplatePath`:    可选。用于高级自定义：OPF 模板的绝对路径。
- `customNcxTocTemplatePath`:    可选。用于高级自定义：NCX 目录模板的绝对路径。
- `customHtmlTocTemplatePath`:    可选。用于高级自定义：HTML 目录模板的绝对路径。
- `content`:    书籍章节内容。它应该是一个对象数组。例如 `[{title: "Chapter 1",data: "<div>..."}, {data: ""},...]`

    **在每个章节对象中：**

    - `title`:        可选，章节标题
    - `author`:        可选，如果每个章节的作者不同，你可以填写。
    - `data`:        必需，章节内容的 HTML 字符串。图像路径应为绝对路径（应以 "http" 或 "https" 开头），以便它们可以被下载。升级后可以使用本地图像（路径必须以 file:// 开头）
    - `excludeFromToc`:        可选，如果不在目录中显示，默认：false；
    - `beforeToc`:        可选，如果在目录之前显示，例如版权页。默认：false；
    - `filename`:        可选，为每个章节指定文件名，默认：未定义；
- `verbose`:    指定是否打印进度消息，默认：false。

#### 输出
如果你不想将输出路径作为第二个参数传递，你应该将输出路径指定为 `option.output`。

------

## 示例代码：

```javascript
    const EPUB = require("epub-gen");

    const option = {
        title: "爱丽丝梦游仙境", // *必需，书籍标题。
        author: "刘易斯·卡罗尔", // *必需，作者名字。
        publisher: "麦克米伦公司", // 可选
        cover: "https://www.alice-in-wonderland.net/wp-content/uploads/1book1.jpg", // URL 或文件路径，均可。
        content: [
            {
                title: "关于作者", // 可选
                author: "约翰·多伊", // 可选
                data: "<h2>查尔斯·路特维奇·道奇森</h2>"
                +"<div lang=\"en\">更广为人知的笔名是刘易斯·卡罗尔...</div>" // 传递 HTML 字符串
            },
            {
                title: "掉进兔子洞",
                data: "<p>爱丽丝开始感到非常疲倦...</p>"
            },
            {
                ...
            }
            ...
        ]
    };

    new EPUB(option, "/path/to/book/file/path.epub");

```

------

## 示例预览：

!示例预览

_摘自刘易斯·卡罗尔的《爱丽丝梦游仙境》，基于 https://www.cs.cmu.edu/~rgs/alice-table.html 的文本和 http://www.alice-in-wonderland.net/resources/pictures/alices-adventures-in-wonderland 的图像。_
