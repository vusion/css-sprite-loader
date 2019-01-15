const postcss = require('postcss');
const { utils } = require('base-css-image-loader');
const meta = require('./meta');
const CSSFruit = require('css-fruit').default;
CSSFruit.config({
    forceParsing: {
        url: true,
        'image-set': true,
        length: true,
        percentage: true,
    },
});

function genMediaQuery(resolution, defaultResolution, selector, content) {
    const dppx = resolution.slice(0, -1);

    if (resolution > defaultResolution) {
        return `@media (-webkit-min-device-pixel-ratio: ${dppx}), (min-resolution: ${dppx}dppx) {
            ${selector} {
                ${content}
            }
        }`;
    } else if (resolution < defaultResolution) {
        return `@media (-webkit-max-device-pixel-ratio: ${dppx}), (max-resolution: ${dppx}dppx) {
            ${selector} {
                ${content}
            }
        }`;
    }
}

module.exports = postcss.plugin('css-sprite-parser', ({ loaderContext }) => (styles, result) => {
    const promises = [];
    const plugin = loaderContext[meta.PLUGIN_NAME];
    const options = plugin.options;
    const data = plugin.data;

    styles.walkRules((rule) => {
        const decls = rule.nodes.filter((node) => node.type === 'decl' && node.prop.startsWith('background'));
        if (!decls.length)
            return;

        const oldBackground = CSSFruit.absorb(decls);
        if (!oldBackground.valid) {
            rule.warn(result, 'Invalid background');
            return;
        }

        if (!oldBackground.image)
            return;

        let oldURLs;
        let oldResolutions;
        if (oldBackground.image._type === 'url')
            oldURLs = [oldBackground.image];
        else if (oldBackground.image._type === 'image-set') {
            oldResolutions = Object.keys(oldBackground.image.values);
            oldURLs = oldResolutions.map((key) => oldBackground.image.values[key]);
        } else
            return;

        const checkURL = (url) => {
            if (!url.path.endsWith('.png'))
                return false;
            if (options.filter === 'query') {
                if (!(url.query && url.query[options.queryParam]))
                    return false;
            } else if (options.filter instanceof RegExp) {
                if (!url.path.test(options.filter))
                    return false;
            } else if (options.filter !== 'all')
                return false;
            return true;
        };
        if (oldURLs.some((url) => !checkURL(url)))
            return;

        promises.push(Promise.all(oldURLs.map((oldURL) => new Promise((resolve, reject) => {
            loaderContext.resolve(loaderContext.context, oldURL.path, (err, result) => err ? reject(err) : resolve(result));
        }))).then((filePaths) => {
            // loaderContext.addDependency(filePath);

            const ruleItem = {
                id: 'ID' + utils.genMD5(oldBackground.toString()),
                oldBackground,
                blockSize: {
                    width: undefined,
                    height: undefined,
                },
                imageSet: {},
            };

            const query = oldURLs[0].query;
            const baseGroupName = typeof query[options.queryParam] === 'string' ? query[options.queryParam] : options.defaultName;

            if (oldBackground.image._type === 'url') {
                const filePath = filePaths[0];
                // According to query retina, collect image set
                const pathRE = /(^.*?)(?:@(\d+x))?\.png$/;
                const paramRE = /^retina@?(\d+x)$/;
                const found = filePath.match(pathRE);
                if (!found)
                    throw new Error('Error format of filePath');
                let [, basePath, defaultResolution] = found;
                if (!defaultResolution)
                    defaultResolution = '1x';
                ruleItem.defaultResolution = defaultResolution;
                // 默认的不一定为 sprite@1x.png，看用户使用情况
                ruleItem.imageSet.default = filePath;

                Object.keys(query).forEach((param) => {
                    // @compat: old version
                    if (param === 'retina')
                        param = 'retina@2x';

                    const found = param.match(paramRE);
                    if (!found)
                        return;

                    const resolution = found[1];
                    ruleItem.imageSet[resolution] = `${basePath}@${resolution}.png`;
                });
            } else if (oldBackground.image._type === 'image-set') {
                ruleItem.defaultResolution = oldResolutions[0];
                ruleItem.imageSet.default = filePaths[0];

                for (let i = 0; i < oldResolutions.length; i++)
                    ruleItem.imageSet[oldResolutions[i]] = filePaths[i];
            }

            // Check width & height
            rule.walkDecls((decl) => {
                if (decl.prop === 'width')
                    ruleItem.blockSize.width = decl.value;
                else if (decl.prop === 'height')
                    ruleItem.blockSize.height = decl.value;
            });

            // Clean source decls
            decls.forEach((decl) => decl.remove());
            Object.keys(ruleItem.imageSet).forEach((resolution) => {
                let groupName = baseGroupName;
                const groupItem = {
                    id: ruleItem.id,
                    filePath: ruleItem.imageSet[resolution],
                    oldBackground,
                    blockSize: ruleItem.blockSize,
                    resolution,
                    content: undefined, // new background cached
                };

                if (resolution === 'default' || resolution === ruleItem.defaultResolution) {
                    rule.append({ prop: 'background', value: `${meta.REPLACER_NAME}(${groupName}, ${groupItem.id})` });
                } else {
                    groupName += '@' + resolution;
                    // No problem in async function
                    rule.after(genMediaQuery(resolution, ruleItem.defaultResolution, rule.selector, `background: ${meta.REPLACER_NAME}(${groupName}, ${groupItem.id});`));
                }

                if (!data[groupName])
                    data[groupName] = {};
                // background 的各种内容没变，id 一定不会变
                if (!data[groupName][groupItem.id])
                    data[groupName][groupItem.id] = groupItem;
            });
        }));
    });

    if (promises.length) {
        plugin.shouldGenerate = true;
        loaderContext._module.isCSSSpriteModule = true;
    }

    return Promise.all(promises);
});
