# css-sprite-loader

this is a webpack loader  convert png into sprite png in CSS

## Example
you need add sprite options after background image url

``` css
.select {
    background: url('../icons/compare.png?sprite');
    color: #666;
}
```
will generate corresponding css so web browsers can recognize.

``` css
.select {
    background: url(/background_sprite.png?5d40e339682970eb14baf6110a83ddde) no-repeat;background-position: -100px -0px;
}
```

## Install

``` shell
npm install --save-dev css-sprite-loader
```

## Features

You must import plugin below in webpack in addition to adding custom properties in CSS.

```javascript
const CssSpritePlugin = require('css-sprite-loader').Plugin;

module.exports = {
    ...
    module: {
        rules: [{ test: /\.css$/, use: ['style-loader', 'css-loader', 'css-sprite-loader'] }],
    },
    plugins: [new CssSpritePlugin()],
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

#### queryParam

customize Whether add this image to sprite image mark

- Type: `String`
- Default: `sprite`

#### defaultName

default sprite png name

- Type: `String`
- Default: `background_sprite`

#### filter

this param define how to sprite png. you can set `query` `all` and a RegExp. when filter is`query`,we will sprite image have queryParam in url param.when filter is `all`, we will sprite all image is imported in css. and RegExp, we will test image url,this url without param.

- Type: `String`
- Default: `query`


### background image url options 

#### sprite

Whether add this image to sprite image, you can set srpiteMark in plugin and customize it

- Type: `string`
- Default: 'background_sprite'


