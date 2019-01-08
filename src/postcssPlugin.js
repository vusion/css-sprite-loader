const postcss = require('postcss');
const { utils } = require('base-css-image-loader');
const CSSFruit = require('css-fruit').default;
CSSFruit.config({
    forceParsing: {
        url: true,
        length: true,
        percentage: true,
    },
});

function genMediaQuery(resolution, selector, content) {
    const dppx = resolution.slice(0, -1);
    return `@media (-webkit-min-device-pixel-ratio: ${dppx}), (min-resolution: ${dppx}dppx) {
        ${selector} {
            ${content}
        }
    }`;
}

module.exports = postcss.plugin('css-sprite-parser', ({ loaderContext }) => (styles, result) => {
    const promises = [];
    const plugin = loaderContext.relevantPlugin;
    const options = plugin.options;
    const data = plugin.data;

    styles.walkRules((rule) => {
        const decls = rule.nodes.filter((node) => node.type === 'decl' && node.prop.startsWith('background'));
        if (!decls.length)
            return;

        let oldBackground;
        try {
            oldBackground = CSSFruit.absorb(decls);
        } catch (e) {
            return Promise.reject(e);
        }
        if (!oldBackground.image)
            return;
        if (!oldBackground.image.path.endsWith('.png'))
            return;
        if (options.filter === 'query') {
            if (!(oldBackground.image.query && oldBackground.image.query[options.queryParam]))
                return;
        } else if (options.filter instanceof RegExp) {
            if (!oldBackground.image.path.test(options.filter))
                return;
        } else if (options.filter !== 'all')
            return;

        promises.push(new Promise((resolve, reject) => {
            loaderContext.resolve(loaderContext.context, oldBackground.image.path, (err, result) => err ? reject(err) : resolve(result));
        }).then((filePath) => {
            loaderContext.addDependency(filePath);

            const ruleItem = {
                id: 'ID' + utils.genMD5(oldBackground.toString()),
                oldBackground,
                blockSize: {
                    width: undefined,
                    height: undefined,
                },
                imageSet: {},
            };

            const query = oldBackground.image.query;
            const baseGroupName = query[options.queryParam] === true ? options.defaultName : query[options.queryParam];

            // According to query retina, collect image set
            const pathRE = /(^.*?)(?:@(\d+x))?\.png$/;
            const paramRE = /^retina@?(\d+x)$/;
            const found = filePath.match(pathRE);
            if (!found)
                throw new Error('Error format of filePath');
            let [, basePath, defaultResolution] = found;
            if (!defaultResolution)
                defaultResolution = 'default';
            // 默认的不一定为 sprite@1x.png，看用户使用情况
            ruleItem.imageSet[defaultResolution] = filePath;
            ruleItem.defaultResolution = defaultResolution;

            Object.keys(query).forEach((param) => {
                // @compat: old version
                if (param === 'retina')
                    param = 'retina@2x';

                const found = param.match(paramRE);
                if (!found)
                    return;

                const resolution = found[1];
                ruleItem.imageSet[resolution] = `${basePath}${resolution === '1x' ? '' : '@' + resolution}.png`;
            });

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

                if (resolution === defaultResolution) {
                    rule.append({ prop: 'background', value: `CSS_SPRITE_LOADER_IMAGE('${groupName}', '${groupItem.id}')` });
                } else {
                    groupName += '@' + resolution;
                    // No problem in async function
                    rule.after(genMediaQuery(resolution, rule.selector, `background: CSS_SPRITE_LOADER_IMAGE('${groupName}', '${groupItem.id}');`));
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
