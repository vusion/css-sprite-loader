'use strict';

const path = require('path');
const Spritesmith = require('spritesmith');
const utils = require('./utils');
const postcss = require('postcss');
const PADDING = 20;
const getAllModules = require('./getAllModules');
const ReplaceSource = require('webpack-sources').ReplaceSource;
const NAMESPACE = 'CssSpritePlugin';
const replaceReg = /REPLACE_BACKGROUND\([^)]*\)/g;
const replaceBackgroundReg = /background-image/;
const backGroundPositionReg = /background-position/;
const backGroundSizeReg = /background-size/;
const ReplaceDependency = require('./replaceDependecy');
const NullFactory = require('webpack/lib/NullFactory');

class ImageSpritePlugin {
    constructor(options) {
        this.options = Object.assign({
            output: './',
            padding: PADDING,
            queryParam: 'sprite',
            defaultName: 'background_sprite',
            filter: 'query',
            plugins: [],
            publicPath: undefined,
        }, options);
    }
    apply(compiler) {
        if (compiler.hooks) {
            compiler.hooks.afterPlugins.tap(NAMESPACE, (compiler) => this.afterPlugins());
            compiler.hooks.thisCompilation.tap(NAMESPACE, (compilation, params) => {
                compilation.hooks.optimizeTree.tapAsync(NAMESPACE, (chunks, modules, callback) => this.optimizeTree(callback, compilation));
                compilation.hooks.optimizeExtractedChunks.tap(NAMESPACE, (chunks) => this.optimizeExtractedChunks(chunks));
                compilation.hooks.afterOptimizeTree.tap(NAMESPACE, (modules) => this.afterOptimizeTree(compilation));
                compilation.hooks.optimizeChunkAssets.tapAsync(NAMESPACE, (chunks, callback) => this.optimizeChunkAssets(chunks, callback, compilation));
            });
            compiler.hooks.compilation.tap(NAMESPACE, (compilation, params) => {
                compilation.hooks.normalModuleLoader.tap(NAMESPACE, (loaderContext) => this.normalModuleLoader(loaderContext));
            });
        } else {
            compiler.plugin('after-plugins', (compiler) => this.afterPlugins());

            compiler.plugin('this-compilation', (compilation, params) => {
                compilation.dependencyFactories.set(ReplaceDependency, new NullFactory());
                compilation.dependencyTemplates.set(ReplaceDependency, ReplaceDependency.Template);
                compilation.plugin('optimize-tree', (chunks, modules, callback) => this.optimizeTree(callback, compilation));
                compilation.plugin('optimize-extracted-chunks', (chunks) => this.optimizeExtractedChunks(chunks));
                compilation.plugin('after-optimize-tree', (modules) => this.afterOptimizeTree(compilation));
                compilation.plugin('optimize-chunk-assets', (chunks, callback) => this.optimizeChunkAssets(chunks, callback, compilation));
            });

            compiler.plugin('compilation', (compilation, params) => {
                compilation.plugin('normal-module-loader', (loaderContext) => this.normalModuleLoader(loaderContext));
            });
        }
    }
    afterPlugins() {
        this.images = {};
    }
    optimizeTree(callback, compilation) {
        let imagePaths = Object.keys(this.images);
        imagePaths = Array.from(new Set(imagePaths)).sort();
        const images = {};
        for (const path of imagePaths)
            images[path] = this.images[path];
        this.images = images;
        const imageList = pickPicture(images, this.options.queryParam);
        const task = [];
        for (const target of Object.keys(imageList)) {
            const paths = imageList[target].path;
            const path2img = imageList[target].path2img;
            const targetFile = target + '.png';
            let imageUrl = '/';
            if (this.options.publicPath)
                imageUrl = utils.urlResolve(this.options.publicPath, targetFile);
            else
                imageUrl = utils.urlResolve(compilation.options.output.publicPath || '', path.join(this.options.output, targetFile));
            const promiseInstance = new Promise((res, rej) => {
                Spritesmith.run({
                    src: paths,
                    algorithm: 'binary-tree',
                    padding: this.options.padding,
                }, (err, result) => {
                    if (err)
                        rej(err);
                    else {
                        res(result);
                    }
                });
            }).then((result) => {
                const coordinates = result.coordinates;
                const assets = compilation.assets;
                const imagePromises = [];
                for (const path of Object.keys(coordinates)) {
                    const image = path2img[path];
                    const baseTarget = image.baseTarget;
                    let baseImage;
                    if (baseTarget)
                        baseImage = images[baseTarget];
                    image.message = coordinates[path];
                    image.message.hash = utils.md5Create(result.image);
                    imagePromises.push(this.createCss(imageUrl, image, result.properties, image.isRetina, baseImage).then((css) => {
                        image.replaceCss = css;
                    }));
                }
                assets[path.join(this.options.output, target + '.png')] = {
                    source: () => result.image,
                    size: () => result.image.length,
                };
                return Promise.all(imagePromises);
            }).catch((err) => err);
            task.push(promiseInstance);
        }
        Promise.all(task).then((values) => {
            callback();
        });
    }
    optimizeExtractedChunks(chunks) {
        const images = {};
        for (const path of Object.keys(this.images)) {
            const image = this.images[path];
            images[image.name] = image;
        }
        chunks.forEach((chunk) => {
            const modules = !chunk.mapModules ? chunk._modules : chunk.mapModules();
            modules.filter((module) => '_originalModule' in module).forEach((module) => {
                const source = module._source;
                if (typeof source === 'string') {
                    module._source = this.replaceStringHolder(module._source, replaceReg, images);
                } else if (typeof source === 'object' && typeof source._value === 'string') {
                    source._value = this.replaceStringHolder(source._value, replaceReg, images);
                }
            });
        });
    }
    optimizeChunkAssets(chunks, callback, compilation) {
        const images = {};
        for (const path of Object.keys(this.images)) {
            const image = this.images[path];
            images[image.name] = image;
        }
        chunks.forEach((chunk) => {
            chunk.files.forEach((file) => {
                if (file.endsWith('.css')) {
                    // 处理css模块
                    const source = compilation.assets[file];
                    let content = compilation.assets[file].source();
                    content = this.replaceStringHolder(content, replaceReg, images);
                    const replaceSource = new ReplaceSource(source);
                    replaceSource.replace(0, source.size(), content);
                    compilation.assets[file] = replaceSource;
                }
            });
        });
        callback();
    }
    afterOptimizeTree(compilation) {
        const allModules = getAllModules(compilation);
        const images = {};
        for (const path of Object.keys(this.images)) {
            const image = this.images[path];
            images[image.name] = image;
        }
        allModules.forEach((module) => {
            const replaceDependency = module.dependencies.filter((dependency) => dependency.constructor === ReplaceDependency)[0];
            const source = module._source;
            let range = [];
            if (typeof source === 'string') {
                range = this.replaceHolder(module._source, replaceReg, images);
            } else if (typeof source === 'object' && typeof source._value === 'string') {
                range = this.replaceHolder(source._value, replaceReg, images);
            }
            if (range.length > 0) {
                if (replaceDependency) {
                    replaceDependency.updateRange(range);
                } else {
                    module.addDependency(new ReplaceDependency(range));
                }
            }
        });
    }
    normalModuleLoader(loaderContext) {
        loaderContext.ImageSpritePlugin = this;
    }
    replaceHolder(value, replaceReg, images) {
        const rangeList = [];
        const haveChecked = [];
        value.replace(replaceReg, ($1, $2) => {
            if (images[$1] && haveChecked.indexOf($1) === -1) {
                haveChecked.push($1);
                const content = images[$1] ? images[$1].replaceCss || $1 : $1;
                let index = value.indexOf($1);
                while (index !== -1) {
                    rangeList.push([index, index + $1.length, content]);
                    index = value.indexOf($1, index + 1);
                }
            }
            return $1;
        });
        value.replace(replaceBackgroundReg, ($1, $2) => {
            let index = value.indexOf($1);
            while (index !== -1) {
                rangeList.push([index, index + $1.length, 'background:']);
                index = value.indexOf($1, index + 1);
            }
            return $1;
        });
        value.replace(backGroundPositionReg, ($1, $2) => {
            let index = value.indexOf($1);
            while (index !== -1) {
                rangeList.push([index, index + $1.length, '']);
                index = value.indexOf($1, index + 1);
            }
            return $1;
        });
        value.replace(backGroundSizeReg, ($1, $2) => {
            let index = value.indexOf($1);
            while (index !== -1) {
                rangeList.push([index, index + $1.length, '']);
                index = value.indexOf($1, index + 1);
            }
            return $1;
        });
        return rangeList;
    }
    replaceStringHolder(value, replaceReg, images) {
        return value.replace(replaceReg, (name) => images[name] ? images[name].replaceCss || name : name);
    }
    createCss(imageUrl, image, properties, isRetina, baseImage) {
        let { x, y, hash } = image.message;
        let { width, height } = properties;
        let result = `.root{ background: url(${imageUrl}?${hash}) no-repeat;}`;
        if (isRetina) {
            const imageWidth = image.message.width;
            const imageHeight = image.message.height;
            const baseWidth = baseImage.size.width;
            const baseHeight = baseImage.size.height;
            const proportionWidth = baseWidth / imageWidth;
            const proportionHeight = baseHeight / imageHeight;
            result = `.root{ background: url(${imageUrl}?${hash}) no-repeat  -${Math.floor(x * proportionWidth)}px -${Math.floor(y * proportionHeight)}px;background-size:${Math.floor(width * proportionWidth)}px ${Math.floor(height * proportionHeight)}px; }`;
        } else {
            let basicWidth = image.message.width;
            let basicHeight = image.message.height;
            let basicX = image.message.x;
            let basicY = image.message.y;
            let horizontalNum = 1;
            let verticalNum = 1;
            let itemRow = 1;
            let itemCol = 1;
            while (basicWidth < width) {
                basicWidth = basicWidth + image.message.width + PADDING;
                horizontalNum++;
            }
            while (basicHeight < height) {
                basicHeight = basicHeight + image.message.height + PADDING;
                verticalNum++;
            }
            while (basicX > 0) {
                itemRow++;
                basicX = basicX - image.message.width - PADDING;
            }
            while (basicY > 0) {
                itemCol++;
                basicY = basicY - image.message.height - PADDING;
            }
            if (image.backgroundSize) {
                if (image.backgroundSize.length === 2) {
                    width = horizontalNum * parseInt(image.backgroundSize[0]) + PADDING * (horizontalNum - 1);
                    height = verticalNum * parseInt(image.backgroundSize[1]) + PADDING * (verticalNum - 1);
                    x = (itemRow - 1) * (parseInt(image.backgroundSize[0]) + PADDING);
                    y = (itemCol - 1) * (parseInt(image.backgroundSize[1]) + PADDING);
                } else if (typeof image.backgroundSize === 'string') {
                    if (image.divWidth && image.divHeight) {
                        width = horizontalNum * parseInt(image.divWidth) + PADDING * (horizontalNum - 1);
                        height = verticalNum * parseInt(image.divHeight) + PADDING * (verticalNum - 1);
                        x = (itemRow - 1) * (parseInt(image.divWidth) + PADDING);
                        y = (itemCol - 1) * (parseInt(image.divHeight) + PADDING);
                    }
                }
            }
            if (image.position) {
                x = x - parseInt(image.position[0]);
                y = y - parseInt(image.position[1]);
            }
            result = `.root{ background: url(${imageUrl}?${hash}) no-repeat  ${(-x).toString()}px ${(-y).toString()}px;background-size:${width}px ${height}px; }`;
        }
        return new Promise((res, rej) => {
            postcss(this.options.plugins).process(result).then((result) => {
                const root = result.root;
                const background = {};
                root.walkRules((rule) => {
                    if (rule.selector === '.root') {
                        rule.walkDecls(/^background/, (decl) => {
                            background[decl.prop] = decl.value;
                        });
                    }
                });
                let resultStr = background.background + ';';
                delete background.background;
                for (const name of Object.keys(background)) {
                    resultStr += `${name}:${background[name]};`;
                }
                res(resultStr);
            });
        });
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
