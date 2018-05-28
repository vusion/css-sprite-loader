'use strict';

const css = require('postcss');
const BG_URL_REG = /url\([\s"']*(.+\.(png|jpg|jpeg|gif)([^\s"']*))[\s"']*\)/i;
const fs = require('fs');
const plugin = require('./Plugin');
let queryParam = 'sprite';
let defaultName = 'background_sprite';
let filter = 'query';
const utils = require('./utils');
const sizeOf = require('image-size');
const retinaMark = 'retina';

function getNextLoader(loader) {
    const loaders = loader.loaders;
    const loaderContexts = loaders.map((loader) => loader.normalExecuted);
    const index = loaderContexts.lastIndexOf(false);
    const nextLoader = loaders[index].normal;
    return nextLoader;
}

function getRetinaPath(path, name) {
    const retinaNumber = getRetinaNumber(name);
    const paths = path.split('/');
    const lastPath = paths[paths.length - 1];
    const fileNames = lastPath.split('.');
    let fileName = fileNames[0];
    fileName = `${fileName}@${retinaNumber}x`;
    fileNames[0] = fileName;
    paths[paths.length - 1] = fileNames.join('.');
    return paths.join('/');
}

function isRetinaMark(name) {
    // if options' name start with 'retina'
    return name.substr(0, retinaMark.length) === retinaMark;
}
function getRetinaNumber(name) {
    if (name === retinaMark)
        return 2;
    return parseInt(name.substring(retinaMark.length, name.length - 1));
}

function analysisBackground(urlStr, basePath) {
    const reg = BG_URL_REG.exec(urlStr);
    if (!reg || urlStr.includes('image-set'))
        return Promise.resolve({ merge: false });
    const url = reg[1];
    const parts = url.split('?');
    let needMerge = false;
    const params = parts[1];
    const result = {
        name: urlStr,
        url: parts[0],
    };
    return new Promise((resolve, reject) => {
        // This path must be resolved by webpack.
        this.resolve(this.context, parts[0], (err, result) => err ? reject(err) : resolve(result));
    }).then((file) => {
        this.addDependency(file);
        result.path = file;
        result.retinas = [];
        if (params) {
            const paramsAst = params.split('&');
            paramsAst.forEach((item) => {
                const param = item.split('=');
                if (filter === 'query') {
                    if (param[0] === queryParam)
                        needMerge = true;
                } else if (filter === 'all')
                    needMerge = true;
                else if (filter instanceof RegExp)
                    needMerge = filter.test(url);
                if (isRetinaMark(param[0])) {
                    result.retinas.push(param[0]);
                    if (!param[1])
                        param[1] = getRetinaPath(file, param[0]);
                }
                result[param[0]] = param[1];
            });
            const spriteMerge = result[queryParam];
            if (spriteMerge === undefined)
                result[queryParam] = defaultName;
        }
        result.merge = needMerge;
        return result;
    });
}

function addImageToList(image, imageList, declaration) {
    if (image.merge) {
        const path = image.path;
        let hash;
        if (imageList[path]) {
            hash = imageList[path].hash;
        } else {
            const filesContent = fs.readFileSync(path);
            hash = utils.md5Create(filesContent);
            image.hash = hash;
            image.size = sizeOf(filesContent);
            imageList[path] = image;
        }
        const name = 'REPLACE_BACKGROUND(' + hash + ')';
        image.name = name;
        declaration.value = name;
        if (image.retinas.length > 0) {
            return {
                selector: declaration.parent.selector,
                retinaNames: image.retinas,
                image,
            };
        }
    }
    return undefined;
}

function ImageSpriteLoader(source) {
    const ImageSpritePlugin = this.ImageSpritePlugin;
    const ast = typeof source === 'string' ? css.parse(source) : source;
    const imageList = ImageSpritePlugin.images;
    const callback = this.async();
    const promises = [];
    const acceptPostCssAst = !!getNextLoader(this).acceptPostCssAst;
    // customize merge mark
    queryParam = ImageSpritePlugin.options.queryParam;
    defaultName = ImageSpritePlugin.options.defaultName;
    filter = ImageSpritePlugin.options.filter;

    ast.walkDecls('background', (declaration) => {
        promises.push(analysisBackground.call(this, declaration.value, this.context).then((image) => {
            const retina = addImageToList(image, imageList, declaration);
            return retina;
        }));
    });
    // ruleWaker(ast);
    Promise.all(promises).then((results) => {
        function finish() {
            let cssStr = '';
            if (!acceptPostCssAst) {
                css.stringify(ast, (str) => {
                    cssStr += str;
                });
            }
            // 第二遍replace真正替换
            callback(null, acceptPostCssAst ? ast : cssStr);
        }
        results = results.filter((result) => !!result);
        const mediaNodes = {};
        const retinaPromises = [];
        if (results.length > 0) {
            // if have retina image add @media rule in ast end;
            results.forEach((result) => {
                const retinaNames = result.retinaNames;
                const { selector, image } = result;
                for (const name of retinaNames) {
                    const retinaNumber = getRetinaNumber(name);
                    const retinaPath = image[name];
                    let mediaNode = mediaNodes[retinaNumber];
                    if (!mediaNode) {
                        ast.append(`@media (-webkit-min-device-pixel-ratio: ${retinaNumber}),(min-resolution: ${retinaNumber}dppx){}`);
                        mediaNode = ast.nodes[ast.nodes.length - 1];
                        mediaNodes[retinaNumber] = mediaNode;
                    }
                    mediaNode.append(`${selector}{background:url(${retinaPath}?${queryParam}=${image[queryParam]}_@${retinaNumber}x&baseTarget=${image.path})}`);
                }
            });
            for (const mediaName of Object.keys(mediaNodes)) {
                const mediaNode = mediaNodes[mediaName];
                mediaNode.walkDecls('background', (declaration) => {
                    retinaPromises.push(analysisBackground.call(this, declaration.value, this.context).then((image) => {
                        addImageToList(image, imageList, declaration);
                        image.isRetina = true;
                    }));
                });
            }
        }
        if (retinaPromises.length === 0) {
            finish();
        } else {
            Promise.all(retinaPromises).then(() => {
                finish();
            });
        }
    }).catch((err) => {
        callback(err, source);
    });
}

ImageSpriteLoader.Plugin = plugin;

ImageSpriteLoader.acceptPostCssAst = true;

module.exports = ImageSpriteLoader;
