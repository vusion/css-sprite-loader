'use strict';

const css = require('postcss');
const fs = require('fs');
const plugin = require('./Plugin2');

const utils = require('./utils');
const logger = utils.logger;

const { 
    backgroundBlockParser, 
    rewriteBackgroundDecl, 
    openSlotInCSSBlock 
} = require('./backgroundBlockParser');
const applySpriteCategory = require('./applySpriteCategory');
const {
    addImageToList, 
    addCSSBlockToList, 
} = require('./addImageToList');

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

function ImageSpriteLoader(source) {
    const callback = this.async();
	const ImageSpritePlugin = this.ImageSpritePlugin;

    const cssBlockList   = ImageSpritePlugin.cssBlockList;
	queryParam           = ImageSpritePlugin.options.queryParam;
    defaultName          = ImageSpritePlugin.options.defaultName;
    filter               = ImageSpritePlugin.options.filter;

    
    const smithImageMergeSet = {};
    const promises = [];
	const ast = typeof source === 'string' ? css.parse(source) : source;
	const acceptPostCssAst = !!getNextLoader(this).acceptPostCssAst;

	ast.walkRules((rule) => {
        const parsedRule = backgroundBlockParser(rule);
        
        const UsingThisLoader = !!parsedRule.image || parsedRule.imageSet.length !== 0;
        if(UsingThisLoader) {
            promises.push(applySpriteCategory.call(this, parsedRule, queryParam, defaultName, filter).then((images) => {
                
                logger('images', images)
                addCSSBlockToList(parsedRule, images, cssBlockList, openSlotInCSSBlock);
            }));
        }

    });

    Promise.all(promises).then(() => {
        let cssStr = '';
        if (!acceptPostCssAst) {
            css.stringify(ast, (str) => {
                cssStr += str;
            });
        }
        callback(null, acceptPostCssAst ? ast : cssStr);

    });

}


ImageSpriteLoader.Plugin = plugin;

ImageSpriteLoader.acceptPostCssAst = true;

module.exports = ImageSpriteLoader;