'use strict';

const css = require('postcss');
const sizeOf = require('image-size');
const fs = require('fs');
const plugin = require('./Plugin');
const path = require('path');
const utils = require('./utils');
const logger = utils.logger;

const backgroundBlockParser = require('./backgroundBlockParser');
const analysisBackground = require('./analysisBackground');

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
	const ImageSpritePlugin = this.ImageSpritePlugin;
	const imageList      = ImageSpritePlugin.images;
	const localImageList = ImageSpritePlugin.localImageList;
	queryParam           = ImageSpritePlugin.options.queryParam;
    defaultName          = ImageSpritePlugin.options.defaultName;
    filter               = ImageSpritePlugin.options.filter;


	const ast = typeof source === 'string' ? css.parse(source) : source;
	const acceptPostCssAst = !!getNextLoader(this).acceptPostCssAst;
	const callback = this.async();
	ast.walkRules((rule) => {
       const parsedRule = backgroundBlockParser(rule);
       //analysisBackground.call(this, parsedRule, this.context);
    });

}


ImageSpriteLoader.Plugin = plugin;

ImageSpriteLoader.acceptPostCssAst = true;

module.exports = ImageSpriteLoader;