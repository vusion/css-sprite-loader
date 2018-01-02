# css-sprite-loader

this is a webpack loader  convert png into sprite png in CSS

## Example
you need add spriteMerge options after background image url

``` css
.select {
    background: url('../icons/compare.png?spriteMerge');
    color: #666;
}
```
will generate corresponding css so web browsers can recognize.

``` css
.select {
    background: url(/background_sprite.png?5d40e339682970eb14baf6110a83ddde) no-repeat;background-position: -100px -0px;
}
```
```

## Install

``` shell
npm install --save-dev css-sprite-loader
```

## Features

You must import plugin below in webpack in addition to adding custom properties in CSS.

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

### loader options

no

### plugin options

#### output

Path of sprite png to webpack output path. **Must be a relative path.**

- Type: `string`
- Default: `./`

#### padding

padding of sprite image

- Type: `Number`
- Default: `20`

### background image url options 

#### spriteMerge

Whether add this image to sprite image

- Type: `string`
- Default: none

#### target

sprite image name

- Type: `string`
- Default: `background_sprite`

