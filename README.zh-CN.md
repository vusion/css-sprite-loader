# css-sprite-loader

- [README in English](README.md)

这是一款可以自动将 png 合并成雪碧图的 Webpack loader。

## 示例

给需要合并的背景图添加 sprite 后缀参数：

``` css
.foo {
    background: url('../images/gift.png?sprite');
}
```

css-sprite-loader 会自动生成雪碧图：

``` css
.foo {
    background: url(/sprite.png?5d40e339682970eb14baf6110a83ddde) no-repeat;
    background-position: -100px -0px;
}
```

## 特性

与别的类似的雪碧图加载器不同的是：

- 全面复用 CSS 的`background`属性，无论是收缩形式还是展开形式。
- 通过路径参数或配置可以很轻松地切换是否使用雪碧图。
- 合并相同场景的图片。如果图片所使用的路径、位置大小、重复情况等背景属性都相同，我们会按同一种图片来处理，减少最后生成的图片大小。

## 安装

``` shell
npm install --save-dev css-sprite-loader
```

## 配置

除了在 Webpack 配置中添加 loader，还需要添加 Plugin。

``` javascript
const CSSSpritePlugin = require('css-sprite-loader').Plugin;

module.exports = {
    ...
    module: {
        rules: [{ test: /\.css$/, use: ['style-loader', 'css-loader', 'css-sprite-loader'] }],
    },
    plugins: [new CSSSpritePlugin()],
};
```

### background url 的后缀参数

#### sprite

是否将当前的图片打入雪碧图，或打入哪个指定的雪碧图。

``` css
.foo {
    background: url('../images/gift.png?sprite');
}

.bar {
    background: url('../images/light.png?sprite=sprite-nav');
}
```

<!-- #### retina
是否添加雪碧图，这个参数接受一个雪碧图的路径，如果你没有设置路径我们将会从当前图片相同目录下查找带有@2x后缀的图片。实际上你也可以是用retina3x 或者 retina4x的后缀，甚至更多这种格式的参数，我们将会一一适配。

- Type: `string`
- Default: 'background_sprite'
 -->

### loader 参数

暂无。

### plugin 参数

#### defaultName

默认雪碧图分组名

- Type: `String`
- Default: `sprite`

#### filename

用于设置生成文件名的模板，类似于 Webpack 的 output.filename。模板支持以下占位符：

- `[ext]` 生成资源文件后缀
- `[name]` 分组名
- `[hash]` 生成文件中 svg 文件的 hash 值（默认使用16进制 md5 hash，所有文件使用 svg 的 hash，其他文件的 hash 有时会发生改变）
- `[<hashType>:hash:<digestType>:<length>]` 生成 hash 的样式
    - `hashType` hash 类型，比如：`sha1`, `md5`, `sha256`, `sha512`
    - `digestType` 数字进制：`hex`, `base26`, `base32`, `base36`, `base49`, `base52`, `base58`, `base62`, `base64`
    - `length` 字符长度


- Type: `string`
- Default: `'[name].[ext]?[hash]'`

#### output

生成的图片文件相对于 webpack 的 output 的相对路径。**必须是一个相对路径。**

- Type: `string`
- Default: `'./'`

#### publicPath

图片在 CSS url 中的路径，与 Webpack 的 publicPath 相同，此选项用于覆盖它。

- Type: `String`
- Default: `''`

#### padding

雪碧图中小图片之间的间距

- Type: `number`
- Default: `'sprite'`

#### filter

如何筛选参与合并雪碧图的小图片文件，可选值：`'all'`、`'query'`、`RegExp`

- `'all'`: 所有被引用的小图片都要被合并
- `'query'`: 只有在路径中添加了`?sprite`后缀参数的小图片才会被合并
- `RegExp`: 根据正则表达式来匹配路径

- Type: `string`
- Default: `'query'`

#### queryParam

自定义路径中的后缀参数 key，当`filter: 'query'`才生效。

- Type: `string`
- Default: `'sprite'`

#### plugins

处理完雪碧图之后，运行 postcss 的插件列表。这些插件不会处理整个文件，只会处理与雪碧图相同的几行代码。比如使用一些单位转换的插件`require('postcss-px-to-viewport')`。

- Type: `Array`
- Default: `[]`

## 修改日志

参见[Releases](https://github.com/vusion/css-sprite-loader/releases)

## 贡献指南

参见[Contributing Guide](https://github.com/vusion/DOCUMENTATION/issues/4)

## 开源协议

[MIT](LICENSE)

