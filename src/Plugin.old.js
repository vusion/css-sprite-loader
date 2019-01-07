'use strict';

const NAMESPACE = 'CssSpritePlugin';
const NullFactory = require('webpack/lib/NullFactory');
const getAllModules = require('./getAllModules');
const ReplaceDependency = require('./replaceDependecy');
const {
    rewriteBackgroundDecl,
    rewriteBackgroundMediaQuery,
} = require('./backgroundBlockParser');
const utils = require('./utils');
const SpriteSmithWrapper = require('./applySpriteSmith.old');
const CSS_RULE = /cssRule-([^;]+);/g;
const MEDIAQ_RULE = /mediaQ(\dx)-([^;]+);/g;
const PADDING = 0;

class CSSSpritePlugin {
    constructor(options) {
        this.options = Object.assign({
            output: './',
            padding: PADDING,
            queryParam: 'sprite',
            defaultName: 'sprite',
            filter: 'query',
            plugins: [],
            publicPath: undefined,
        }, options);
        this.spriteSmith = new SpriteSmithWrapper(this.options);
    }

    attachMediaQuery(chunks, callback) {
        console.log('attachMediaQuery');
        chunks.forEach((chunk) => {
            console.log({
                id: chunk.id,
                name: chunk.name,
                includes: chunk.modules.map((module) => module.request),
            });
        });
        callback();
    }

    // replaceHolder(source) {
    //     const blocks = this.cssBlockList;
    //     const rangeList = [];
    //     let arr;

    //     // source.replaceReg()
    //     while ((arr = CSS_RULE.exec(source)) !== null) {
    //         const [matched, hash] = arr;
    //         const index = arr.index;
    //         // console.log(matched.substring(0, matched.length-1), hash, index);
    //         const block = blocks[matched.substring(0, matched.length - 1)];
    //         const css = rewriteBackgroundDecl(block.parsedRule);
    //         rangeList.push([index - 12, index + matched.length - 1, css]);
    //     }

    //     while ((arr = MEDIAQ_RULE.exec(source)) !== null) {
    //         const [matched, group, hash] = arr;
    //         const index = arr.index;
    //         // const block = blocks[matched.substring(0, matched.length-1)];
    //         const block = blocks[`cssRule-${hash}`];
    //         const css = rewriteBackgroundMediaQuery(block.parsedRule, group);
    //         rangeList.push([index - 11, index + matched.length - 1, css]);
    //     }
    //     return rangeList;
    // }
}

module.exports = CSSSpritePlugin;
