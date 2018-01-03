# css-sprite-loader

这是一款Webpack loader，它可以自动将png合并生成雪碧图

## 示例

在需要的背景图路径中增加spriteMerge后缀传参，loader自动将图标合并到雪碧图中

``` css
.select {
    background: url('../icons/compare.png?spriteMerge');
    color: #666;
}
```

通过css-sprite-loader将会转变为浏览器可识别的CSS：

``` css
.select {
    background: url(/background_sprite.png?5d40e339682970eb14baf6110a83ddde) no-repeat;background-position: -100px -0px;
}
```
```

## 安装

``` shell
npm install --save-dev css-sprite-loader
```

## 配置

除了在CSS中添加自定义属性，还需要在Webpack配置中添加一个Plugin。

```javascript
const CsssSpritePlugin = require('css-sprite-loader').Plugin;

module.exports = {
    ...
    module: {
        rules: [{ test: /\.css$/, use: ['style-loader', 'css-loader', 'css-sprite-loader'] }],
    },
    plugins: [new IconFontPlugin()],
};
```

### loader参数

暂无。

### plugin参数

#### output

字体和CSS等文件对于webpack的output的相对路径。**必须是一个相对路径。**

- Type: `string`
- Default: `./`


#### padding

雪碧图内边距

- Type: `Number`
- Default: `20`
#### srpiteMark

是否打入到sprite图中标记自定义

- Type: `String`
- Default: `sprite`

### background后缀传参

#### sprite

是否将当前图标打入sprite图中, 你可以通过设置plugin的spriteMark属性来控制

- Type: `string`
- Default: 无

#### group

生成到目标sprite图的名称

- Type: `string`
- Default: `background_sprite`


