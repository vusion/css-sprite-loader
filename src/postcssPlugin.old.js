'use strict';

const postcss = require('postcss');
const Plugin = require('./Plugin.old');

const {
    backgroundBlockParser,
    rewriteBackgroundDecl,
    openSlotInCSSBlock,
} = require('./backgroundBlockParser');

const applySpriteCategory = require('./applySpriteCategory');
const {
    addCSSBlockToList,
} = require('./addCSSBlockToList');

module.exports = postcss.plugin('css-sprite-parser', ({ loaderContext }) => (styles, result) => {
    const promises = [];
    const plugin = loaderContext.relevantPlugin;

    styles.walkRules((rule) => {
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
});

let queryParam = 'sprite';
let defaultName = 'sprite';
let filter = 'query';

function mediaQuery(retinaNumber) {
    return `@media (-webkit-min-device-pixel-ratio: ${retinaNumber}),(min-resolution: ${retinaNumber}dppx){}`;
}

function cssSpriteLoader(source) {
    const cssBlockList = Plugin.cssBlockList;
    queryParam = Plugin.options.queryParam;
    defaultName = Plugin.options.defaultName;
    filter = Plugin.options.filter;

    const needMediaQuery = false;
    const mediaQ = {};
}
