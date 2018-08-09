# css-sprite-loader

- [README in English](README.md)

这是一款可以自动将 png 合并成雪碧图的 Webpack loader。

## 示例

给需要合并的背景图添加 sprite 后缀参数：

``` css
.foo {
    background: url('../icons/compare.png?sprite');
}
```

css-sprite-loader 会自动生成雪碧图：

``` css
.foo {
    background: url(/sprite.png?5d40e339682970eb14baf6110a83ddde) no-repeat;
    background-position: -100px -0px;
}
```

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
    background: url('../icons/compare.png?sprite');
}

.bar {
    background: url('../icons/message.png?sprite=sprite-nav');
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

默认合并的雪碧图名称

- Type: `String`
- Default: `sprite`

#### output

生成的雪碧图相对于 webpack 的 output 的相对路径。**必须是一个相对路径。**

- Type: `string`
- Default: `./`

#### padding

- Type: `number`
- Default: `'sprite'`

雪碧图中小图片之间的间距

#### filter

如何筛选参与合并雪碧图的小图片文件，可选值：`'all'`、`'query'`、`RegExp`

- `'all'`: 所有被引用的小图片都要被合并
- `'query'`: 只有在路径中添加了`?sprite`后缀参数的小图片才会被合并
- `RegExp`: 根据正则表达式来匹配路径

- Type: `string`
- Default: `'query'`

#### queryParam

自定义路径中的后缀参数key，当`filter: 'query'`才生效。

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

