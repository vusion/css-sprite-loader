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
    background: url('../icons/compare.png?sprite');
}
```

Then `css-sprite-loader` will generate a sprite image.

``` css
.foo {
    background: url(/sprite.png?5d40e339682970eb14baf6110a83ddde) no-repeat;
    background-position: -100px -0px;
}
```

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
    background: url('../icons/compare.png?sprite');
}

.bar {
    background: url('../icons/message.png?sprite=sprite-nav');
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

- Type: `string`
- Default: `'sprite'`

Default file name of sprite output file.

#### output

Path of sprite png to webpack output path. **Must be a relative path.**

- Type: `string`
- Default: `./`

#### padding

- Type: `number`
- Default: `'sprite'`

The margin between small images in sprite.

- Type: `Number`
- Default: `20`

#### filter

- Type: `string`
- Default: `'all'`

Options: `'all'`、`'query'`、`RegExp`

How to filter image files for merging:
- `'all'`: All imported images will be merged.
- `'query'`: Only image path with `?sprite` query param will be merged.
- `RegExp`: Only image path matched by RegExp

#### queryParam

Customize key of query param in svg path. Only works when `filter: 'query'`

- Type: `string`
- Default: `'sprite'`

#### plugins

Postcss plugin list

- Type: `Array`
- Default: `[]`

These postcss plugins will be processed on related codes after creating sprite image. For example, you can use `require('postcss-px-to-viewport')` to convert units of background value.

## Changelog

See [Releases](https://github.com/vusion/css-sprite-loader/releases)

## Contributing

See [Contributing Guide](https://github.com/vusion/DOCUMENTATION/issues/8)

## License

[MIT](LICENSE)
