'use strict';

const css = require('css');
const path = require('path');
const BG_URL_REG = /url\([\s"']*(.+\.(png|jpg|jpeg|gif)([^\s"']*))[\s"']*\)/i;
const fs = require('fs');
const plugin = require('./Plugin');

function analysisBackground(urlStr, basePath) {
    const url = BG_URL_REG.exec(urlStr)[1];
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
            const spriteMerge = paramsAst.indexOf('spriteMerge');
            needMerge = paramsAst.indexOf('spriteMerge') > -1;
            if (needMerge) {
                paramsAst.splice(spriteMerge, 1);
                paramsAst.forEach((item) => {
                    const param = item.split('=');
                    result[param[0]] = param[1];
                });
            }
        }
        if (!result.target)
            result.target = 'background_sprite';
        result.merge = needMerge;
        return result;
    });
};

function ImageSpriteLoader(source) {
    const ast = css.parse(source);
    const imageList = this.ImageSpritePlugin.images;
    const rules = Array.from(ast.stylesheet.rules);
    const callback = this.async();
    const promises = [];
    while (rules.length > 0) {
        const rule = rules.pop();
        const declarations = Array.from(rule.declarations || []);
        while (declarations.length > 0) {
            const declaration = declarations.pop();
            if (declaration.property === 'background') {
                promises.push(analysisBackground.call(this, declaration.value, this.context).then((imageUrl) => {
                    if (imageUrl.merge) {
                        const name = 'REPLACE_BACKGROUND(' + imageUrl.url + ')';
                        imageList[name] = imageUrl;
                        declaration.value = name;
                    }
                    return imageUrl;
                }));
            }
        }
    }
    Promise.all(promises).then(() => {
        // 第二遍replace真正替换
        callback(null, css.stringify(ast));
    }).catch((err) => {
        callback(err, source);
    });
}

ImageSpriteLoader.plugin = plugin;

module.exports = ImageSpriteLoader;
