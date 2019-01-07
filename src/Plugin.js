'use strict';

const fs = require('fs');
const path = require('path');
const SpriteSmith = require('spritesmith');
const { BasePlugin } = require('base-css-image-loader');
const computeNewBackground = require('./computeNewBackground');

class CSSSpritePlugin extends BasePlugin {
    constructor(options) {
        options = options || {};
        super();

        this.NAMESPACE = 'CSSSpritePlugin';
        this.MODULE_MARK = 'isCSSSpriteModule';
        this.REPLACE_REG = /CSS_SPRITE_LOADER_IMAGE\('([^)'"]*?)', '([^)'"]*)'\)/g;
        this.REPLACE_AFTER_OPTIMIZE_TREE = true;

        this.options = Object.assign(this.options, {
            // @inherit: output: './',
            // @inherit: filename: '[fontName].[ext]?[hash]',
            // @inherit: publicPath: undefined,
            padding: 40,
            queryParam: 'sprite',
            defaultName: 'sprite',
            filter: 'query',
            plugins: [],
        }, options);
        // this.spriteSmith =
        this.data = {}; // { [group: string]: { [md5: string]: { url, filePath, md5 } } }
    }
    apply(compiler) {
        this.plugin(compiler, 'thisCompilation', (compilation, params) => {
            this.plugin(compilation, 'optimizeTree', (chunks, modules, callback) => this.optimizeTree(compilation, chunks, modules, callback));
        });
        super.apply(compiler);
    }

    optimizeTree(compilation, chunks, modules, callback) {
        const promises = Object.keys(this.data).map((groupName) => {
            const group = this.data[groupName];
            const files = Object.keys(group).map((key) => group[key].filePath);

            return new Promise((resolve, reject) => SpriteSmith.run({
                src: files,
                algorithm: 'binary-tree',
                padding: this.options.padding,
            }, (err, result) => err ? reject(err) : resolve(result)))
                .then((result) => {
                    const output = this.getOutput({
                        name: groupName,
                        ext: 'png',
                        content: result.image,
                    }, compilation);

                    compilation.assets[output.path] = {
                        source: () => result.image,
                        size: () => result.image.length,
                    };

                    const coordinates = result.coordinates;
                    Object.keys(group).forEach((key) => {
                        const item = group[key];
                        // Add new background according to result of sprite
                        item.background = computeNewBackground(item.oldBackground, item.blockSize, coordinates[item.filePath], result.properties);
                        item.background.image = `url('${output.url.replace(/'/g, "\\'")}')`;
                        item.background.valid = true;
                    });
                });
        });

        Promise.all(promises).then(() => callback());
    }

    /**
     * @override
     * Replace Function
     */
    REPLACE_FUNCTION(groupName, id) {
        return this.data[groupName][id].background.toString();
    }

    /**
     * @override
     * Replace Function to escape
     */
    REPLACE_FUNCTION_ESCAPED(groupName, id) {
        return this.data[groupName][id].background.toString();
    }
}

module.exports = CSSSpritePlugin;
