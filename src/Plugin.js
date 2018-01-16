'use strict';

const path = require('path');
const fs = require('fs');
const shell = require('shelljs');
const webpack = require('webpack');
const Spritesmith = require('spritesmith');
const Source = require('webpack-sources');
const utils = require('./utils');
const PADDING = 20;
const RawSource = require('webpack-sources').RawSource;

class ImageSpritePlugin {
    constructor(options) {
        this.options = Object.assign({
            output: './',
            padding: PADDING,
            queryParam: 'sprite',
            defaultName: 'background_sprite',
            filter: 'query',
        }, options);
    }
    apply(compiler) {
        compiler.plugin('after-plugins', (compiler) => {
            this.images = {};
        });

        compiler.plugin('this-compilation', (compilation, params) => {
            compilation.plugin('additional-assets', (callback) => {
                // 生成静态资源
                const images = this.images;
                const imageList = pickPicture(images, this.options.queryParam);
                const task = [];
                for (const target of Object.keys(imageList)) {
                    const paths = imageList[target].path;
                    const path2img = imageList[target].path2img;
                    const imageUrl = path.join(compilation.options.output.publicPath || '', target + '.png');
                    const promiseInstance = new Promise((res, rej) => {
                        Spritesmith.run({
                            src: paths,
                            algorithm: 'binary-tree',
                            padding: this.options.padding,
                        }, (err, result) => {
                            if (err)
                                rej(err);
                            res(result);
                        });
                    }).then((result) => {
                        const coordinates = result.coordinates;
                        const assets = compilation.assets;
                        for (const path of Object.keys(coordinates)) {
                            const image = path2img[path];
                            image.message = coordinates[path];
                            image.message.hash = utils.md5Create(result.image);
                            image.replaceCss = this.createCss(imageUrl, image.message);
                        }
                        assets[path.join(this.options.output, target + '.png')] = {
                            source: () => result.image,
                            size: () => result.image.length,
                        };
                    }).catch((err) => err);
                    task.push(promiseInstance);
                }
                Promise.all(task).then((values) => {
                    callback();
                });
            });
            compilation.plugin('optimize-chunk-assets', (chunks, callback) => {
                const imageList = Object.keys(this.images);
                const images = this.images;
                const replaceReg = /REPLACE_BACKGROUND\([^)]*\)/g;
                chunks.forEach((chunk) => {
                    chunk.files.forEach((file) => {
                        if (file.endsWith('.js') || file.endsWith('.css')) {
                            // 处理css模块
                            let content = compilation.assets[file].source();
                            content = content.replace(replaceReg, (name) => images[name] ? images[name].replaceCss : name);
                            compilation.assets[file] = new RawSource(content);
                        }
                    });
                });
                callback();
            });
        });

        compiler.plugin('compilation', (compilation, params) => {
            compilation.plugin('normal-module-loader', (loaderContext) => {
                loaderContext.ImageSpritePlugin = this;
            });
        });
    }
    createCss(imageUrl, message) {
        const { x, y, hash } = message;
        return `url(${imageUrl}?${hash}) no-repeat;background-position: -${x}px -${y}px`;
    }
}

function pickPicture(imageList, mark) {
    const result = {};
    for (const name of Object.keys(imageList)) {
        const image = imageList[name];
        let target = result[image[mark]];
        if (!target) {
            target = {
                path: [],
                path2img: {},
            };
        }
        target.path.push(image.path);
        target.path2img[image.path] = image;
        result[image[mark]] = target;
    }
    return result;
}

module.exports = ImageSpritePlugin;
