'use strict';

const path = require('path');
const Spritesmith = require('spritesmith');
const NAMESPACE = 'CssSpritePlugin';
const NullFactory = require('webpack/lib/NullFactory');
const getAllModules = require('./getAllModules');
const ReplaceDependency = require('./replaceDependecy');
const { 
    rewriteBackgroundDecl, 
} = require('./backgroundBlockParser');
const utils = require('./utils')
const SpriteSmithWrapper = require('./applySpriteSmith');
const CSS_RULE = /cssRule\-([^;]+);/g
const PADDING = 0;

class ImageSpritePlugin {
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
        this.spriteSmith = new SpriteSmithWrapper(this.options)
    }
    apply(compiler){
    	if(compiler.hooks){
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
    	}else {
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
        this.cssBlockList = {};
        //this.localImageList = {};
    }
    optimizeTree(callback, compilation){
    	Promise.all(this.spriteSmith.apply(this.cssBlockList, compilation))
    		.then(() => {
    			callback();
    		});
    }
    optimizeExtractedChunks(chunks){
    }
    optimizeChunkAssets(chunks, callback, compilation){
    	callback();
    }
    afterOptimizeTree(compilation){
    	const allModules = getAllModules(compilation);

        allModules.forEach(module => {
        	const replaceDependency = module.dependencies.filter((dependency) => dependency.constructor === ReplaceDependency)[0];
            const source = module._source;
            let range = [];
            if (typeof source === 'string') {
                range = this.replaceHolder(module._source);
            } else if (typeof source === 'object' && typeof source._value === 'string') {
                range = this.replaceHolder(source._value);
            }
            if (range.length > 0) {
                if (replaceDependency) {
                    replaceDependency.updateRange(range);
                } else {
                    module.addDependency(new ReplaceDependency(range));
                }
            }
        }) 
    }

    normalModuleLoader(loaderContext) {
        loaderContext.ImageSpritePlugin = this;
    }

    replaceStringHolder(source){
    	const blocks = this.cssBlockList;
    	let arr;
    	// source.replaceReg()
    	while((arr = CSS_RULE.exec(source)) !== null){

    	}
    }

    replaceHolder(source){
    	const blocks = this.cssBlockList;
    	const rangeList = [];
    	let arr;
    	// source.replaceReg()
    	while((arr = CSS_RULE.exec(source)) !== null){
    		const [matched, hash] = arr;
    		const index = arr.index;
    		// console.log(matched.substring(0, matched.length-1), hash, index);
    		const block = blocks[matched.substring(0, matched.length-1)];
    		const css = rewriteBackgroundDecl(block.parsedRule);
    		rangeList.push([index - 12, index + matched.length -1, css]);
    	}
    	return rangeList;
    }
}

module.exports = ImageSpritePlugin;