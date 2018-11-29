'use strict';

const postcss = require('postcss');
const Plugin = require('./Plugin');

const {
    backgroundBlockParser,
    rewriteBackgroundDecl,
    openSlotInCSSBlock,
} = require('./backgroundBlockParser');
const applySpriteCategory = require('./applySpriteCategory');
const {
    addCSSBlockToList,
} = require('./addCSSBlockToList');

let queryParam = 'sprite';
let defaultName = 'sprite';
let filter = 'query';

function getNextLoader(loader) {
    const loaders = loader.loaders;
    const loaderContexts = loaders.map((loader) => loader.normalExecuted);
    const index = loaderContexts.lastIndexOf(false);
    const nextLoader = loaders[index].normal;
    return nextLoader;
}

function mediaQuery(retinaNumber) {
    return `@media (-webkit-min-device-pixel-ratio: ${retinaNumber}),(min-resolution: ${retinaNumber}dppx){}`;
}

function cssSpriteLoader(source) {
    const callback = this.async();
    const CSSSpritePlugin = this.CSSSpritePlugin;

    const cssBlockList = CSSSpritePlugin.cssBlockList;
    queryParam = CSSSpritePlugin.options.queryParam;
    defaultName = CSSSpritePlugin.options.defaultName;
    filter = CSSSpritePlugin.options.filter;

    const promises = [];
    // 为了提高性能，这种方案只需解析一次 PostCSS
    const ast = typeof source === 'string' ? postcss.parse(source) : source;
    const acceptPostCssAst = !!getNextLoader(this).acceptPostCssAst;
    let needMediaQuery = false;
    const mediaQ = {};

    ast.walkRules((rule) => {
        const parsedRule = backgroundBlockParser(rule);

        const UsingThisLoader = !!parsedRule.image || parsedRule.imageSet.length !== 0;
        if (UsingThisLoader) {
            promises.push(applySpriteCategory.call(this, parsedRule, queryParam, defaultName, filter).then(({ parsedRule, images }) => {
                // logger('images', images)
                if (parsedRule.imageSet.length > 0)
                    needMediaQuery = true;
                addCSSBlockToList(parsedRule, images, cssBlockList, openSlotInCSSBlock);
            }));
        }
    });

    Promise.all(promises).then(() => {
        if (needMediaQuery) {
            Object.keys(cssBlockList).forEach((k) => {
                const {
                    parsedRule,
                    hashMediaQ,
                } = cssBlockList[k];
                if (parsedRule.imageSet.length > 0) {
                    parsedRule.imageSet.forEach((m) => {
                        const retinaNumber = /(\dx)/.exec(m.split(' ')[1])[1];
                        if (Number(/(\d)x/.exec(retinaNumber)[1]) > 1) {
                            if (!mediaQ[retinaNumber])
                                mediaQ[retinaNumber] = [];

                            mediaQ[retinaNumber].push({ parsedRule, hashMediaQ });
                        }
                    });
                }
            });
            Object.keys(mediaQ).forEach((retinaNumber) => {
                ast.append(mediaQuery(Number(/(\d)x/.exec(retinaNumber)[1])));
                const node = ast.nodes[ast.nodes.length - 1];
                mediaQ[retinaNumber].forEach((q) => {
                    node.append(`${q.parsedRule.selector}{background:${q.hashMediaQ[retinaNumber]};}`);
                });
            });
        }

        let cssStr = '';
        if (!acceptPostCssAst) {
            postcss.stringify(ast, (str) => {
                cssStr += str;
            });
        }
        callback(null, acceptPostCssAst ? ast : cssStr);
    });
}

cssSpriteLoader.Plugin = Plugin;

cssSpriteLoader.acceptPostCssAst = true;

module.exports = cssSpriteLoader;
