# css-sprite-loader

- [中文说明](README.zh-CN.md)

Webpack loader for creating PNG sprites.

[![CircleCI][circleci-img]][circleci-url]
[![NPM Version][npm-img]][npm-url]
[![Dependencies][david-img]][david-url]
[![NPM Download][download-img]][download-url]

[circleci-img]: https://img.shields.io/circleci/project/github/vusion/css-sprite-loader.svg?style=flat-square
[circleci-url]: https://circleci.com/gh/vusion/css-sprite-loader
[npm-img]: http://img.shields.io/npm/v/css-sprite-loader.svg?style=flat-square
[npm-url]: http://npmjs.org/package/css-sprite-loader
[david-img]: http://img.shields.io/david/vusion/css-sprite-loader.svg?style=flat-square
[david-url]: https://david-dm.org/vusion/css-sprite-loader
[download-img]: https://img.shields.io/npm/dm/css-sprite-loader.svg?style=flat-square
[download-url]: https://npmjs.org/package/css-sprite-loader

## Example

Just add a `?sprite` query after background image url:

``` css
.foo {
    background: url('../assets/gift.png?sprite');
}
```

Then `css-sprite-loader` will generate a sprite image.

``` css
.foo {
    background: url(/sprite.png?5d40e339682970eb14baf6110a83ddde) no-repeat;
    background-position: -100px -0px;
}
```

## Features

Our loader works in a way different to others:

- Easy to switch whether use sprite or not by path query.
- Support retina.
- Fully support css `background` property, includes `background-position`, `background-size` and others. Make sure there are same effect before and after handling. For example:

``` css
.bg-position-and-size {
    width: 100px;
    height: 150px;
    background: url('../images/html.png?sprite') 30px 20px no-repeat;
    background-size: 100%;
}
```

will be newly computed position and size into

``` css
.bg-position-and-size {
    width: 100px;
    height: 150px;
    background: url('dest/sprite.png?dc5323f7f35c65a3d6c7f253dcc07bad') -101.25px -111.25px / 231px 231px no-repeat;
}
```

> **NOTE**
> - When using `background-position`, value must be pixel and position must be left and top.
> - When using `background-size`, `width` and `height` properties must be declared in the same rule, and value of those must be pixel.


## Install

``` shell
npm install --save-dev css-sprite-loader
```

## Config

You need add a loader and a plugin in Webpack config file.

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

### Query params in background url

#### sprite

Whether pack this image into sprite. Or set which sprite group to pack. For example:

``` css
.foo {
    background: url('../images/gift.png?sprite');
}

.bar {
    background: url('../images/light.png?sprite=sprite-nav');
}
```

images will be packed into two sprites.

``` css
.foo {
    background: url('dest/sprite.png?fee16babb11468e0724c07bd3cf2f4cf');
}

.bar {
    background: url('dest/sprite-nav.png?56d33b3ab0389c5b349cec93380b7ceb');
}
```

#### retina@2x, retina@3x, retina@4x, ...

Whether use retina. For example, you have a following directory.

```
images/
    angry-birds.png
    angry-birds@2x.png
    angry-birds@4x.png
```

``` css
.retina {
    width: 128px;
    height: 128px;
    background: url('../../fixtures/images/retina/angry-birds.png?sprite&retina@2x&retina@4x');
    background-size: 100%;
}
```

will be converted to

``` css
.retina {
    width: 128px;
    height: 128px;
    background: url('dest/sprite.png?369108fb0a164b04ee10def7ed6d4226') -296px 0 / 424px 424px no-repeat;
}

@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 2dppx) {
    .retina {
        background: url('dest/sprite@2x.png?51d951f98092152d8fc56bf3380577e3') -148px 0 / 276px 128px no-repeat;
    }
}

@media (-webkit-min-device-pixel-ratio: 4), (min-resolution: 4dppx) {
    .retina {
        background: url('dest/sprite@4x.png?4a6a7dbace7933efe321b357d4db2fb9') 30px 20px / 213px 102px no-repeat;
    }
}
```

You can also use @2x as default resolution:

```
images/
    angry-birds@1x.png
    angry-birds@2x.png
    angry-birds@4x.png
```

``` css
.retina {
    width: 128px;
    height: 128px;
    background: url('../../fixtures/images/retina/angry-birds@2x.png?sprite&retina@1x&retina@4x');
    background-size: 100%;
}
```

This will be converted to

``` css
.retina {
    width: 128px;
    height: 128px;
    background: url('dest/sprite.png?369108fb0a164b04ee10def7ed6d4226') 0 0 / 212px 212px no-repeat;
}

@media (-webkit-max-device-pixel-ratio: 1), (max-resolution: 1dppx) {
    .retina {
        background: url('dest/sprite@1x.png?e5cf95daa8d2c40e290009620b13fba3') 0 0 / 128px 128px no-repeat;
    }
}

@media (-webkit-min-device-pixel-ratio: 4), (min-resolution: 4dppx) {
    .retina {
        background: url('dest/sprite@4x.png?4a6a7dbace7933efe321b357d4db2fb9') 30px 20px / 213px 102px no-repeat;
    }
}
```

### loader options

None.

### plugin options

#### defaultName

Default sprite group name.

- Type: `string`
- Default: `'sprite'`

#### filename

Output filename format like output. filename of Webpack. The following tokens will be replaced:

- `[ext]` the extension of the resource
- `[name]` the group name
- `[hash]` the hash of svg file (Buffer) (by default it's the hex digest of the md5 hash, and all file will use hash of the svg file)
- `[<hashType>:hash:<digestType>:<length>]` optionally one can configure
    - other `hashType`s, i. e. `sha1`, `md5`, `sha256`, `sha512`
    - other `digestType`s, i. e. `hex`, `base26`, `base32`, `base36`, `base49`, `base52`, `base58`, `base62`, `base64`
    - and `length` the length in chars


- Type: `string`
- Default: `'[name].[ext]?[hash]'`

#### output

Output path of emitted image files, relative to webpack output path. **Must be a relative path.**

- Type: `string`
- Default: `'./'`

#### publicPath

Image public path in css url, same as webpack output.publicPath. This option is for overriding it.

- Type: `string`
- Default: `''`

#### padding

The padding between small images in sprite.

- Type: `number`
- Default: `20`

#### filter

- Type: `string`
- Default: `'all'`

Options: `'all'`、`'query'`、`RegExp`

How to filter source image files for merging:

- `'all'`: All imported images will be merged.
- `'query'`: Only image path with `?sprite` query param will be merged.
- `RegExp`: Only image path matched by RegExp

#### queryParam

Customize key of query param in svg path. Only works when `filter: 'query'`.

- Type: `string`
- Default: `'sprite'`

#### plugins

Postcss plugins will be processed on related codes after creating sprite image. For example, you can use `require('postcss-px-to-viewport')` to convert units of background value.

- Type: `Array`
- Default: `[]`

## Changelog

See [Releases](https://github.com/vusion/css-sprite-loader/releases)

## Contributing

See [Contributing Guide](https://github.com/vusion/DOCUMENTATION/issues/8)

## License

[MIT](LICENSE)
