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

- Fully reuse css `background` property, both shorthand and longhand.
- Easy to toggle whether use sprite or not by path query or config.
- Merge duplicated pngs in the same situation. We will merge those pngs into only one to keep slim even they lie in different places in your project.


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

### background url query

#### sprite

Whether add this image into sprite image and set which sprite image

``` css
.foo {
    background: url('../assets/gift.png?sprite');
}

.bar {
    background: url('../assets/light.png?sprite=sprite-nav');
}
```

<!-- #### retina

Whether add retina image, this option accept retina image path, if you don't set retina image path,
We will search for an image file with @2x in the same folder as the image of retina. For example /images/test.png@sprite&retina we will go to find /images/test@2x.png. you can also use retina3x or retina4x, we will adaptation screen with 3dppx or 4dppx

- Type: `string`
- Default: 'background_sprite' -->

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
