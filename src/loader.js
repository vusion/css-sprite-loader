'use strict';

const css = require('postcss');
const path = require('path');
const BG_URL_REG = /url\([\s"']*(.+\.(png|jpg|jpeg|gif)([^\s"']*))[\s"']*\)/i;
const fs = require('fs');
const plugin = require('./Plugin');
let queryParam = 'sprite';
let defaultName = 'background_sprite';
let filter = 'query';

function getNextLoader(loader) {
    const loaders = loader.loaders;
    const previousRequest = loader.previousRequest;
    const loaderContexts = loaders.map((loader) => {
        return loader.normalExecuted;
    });
    const index = loaderContexts.lastIndexOf(false);
    const nextLoader = loaders[index].normal;
    return nextLoader;
}

function analysisBackground(urlStr, basePath) {
    const reg = BG_URL_REG.exec(urlStr);
    if (!reg)
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

function ImageSpriteLoader(source) {
    const ImageSpritePlugin = this.ImageSpritePlugin;
    const ast = typeof source === 'string' ? css.parse(source) : source;
    const imageList = ImageSpritePlugin.images;
    const rules = Array.from(ast.nodes);
    const callback = this.async();
    const promises = [];
    const acceptPostCssAst = !!getNextLoader(this).acceptPostCssAst;

    const ruleWaker = (rule) => {
        if (rule.type === 'decl' && !rule.nodes) {
            const declaration = rule;
            if (declaration.prop === 'background') {
                promises.push(analysisBackground.call(this, declaration.value, this.context).then((imageUrl) => {
                    if (imageUrl.merge) {
                        const name = 'REPLACE_BACKGROUND(' + imageUrl.url + ')';
                        imageList[name] = imageUrl;
                        declaration.value = name;
                    }
                    return imageUrl;
                }));
            }
        } else if (rule.nodes instanceof Array) {
            const rules = Array.from(rule.nodes);
            while (rules.length > 0) {
                const childRule = rules.pop();
                ruleWaker(childRule);
            }
        }
    };
    // customize merge mark
    queryParam = ImageSpritePlugin.options.queryParam;
    defaultName = ImageSpritePlugin.options.defaultName;
    filter = ImageSpritePlugin.options.filter;
    ruleWaker(ast);
    Promise.all(promises).then(() => {
        let cssStr = '';
        if (!acceptPostCssAst) {
            css.stringify(ast, (str) => {
                cssStr += str;
            });
        }
        // 第二遍replace真正替换
        callback(null, acceptPostCssAst ? ast : cssStr);
    }).catch((err) => {
        callback(err, source);
    });
}

ImageSpriteLoader.Plugin = plugin;

ImageSpriteLoader.acceptPostCssAst = true;

module.exports = ImageSpriteLoader;
