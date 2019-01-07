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

module.exports = postcss.plugin('css-sprite-parser', ({ loaderContext }) => (styles, result) => {
    const promises = [];
    const plugin = loaderContext.relevantPlugin;
    const defaultName = plugin.options.defaultName;
    const queryParam = plugin.options.queryParam;
    const data = plugin.data;

    styles.walkRules((rule) => {
        const decls = rule.nodes.filter((node) => node.type === 'decl' && node.prop.startsWith('background'));
        if (!decls.length)
            return;
        const oldBackground = CSSFruit.absorb(decls);
        if (!(oldBackground.image && oldBackground.image.query && oldBackground.image.query[queryParam]))
            return;

        promises.push(new Promise((resolve, reject) => {
            loaderContext.resolve(loaderContext.context, oldBackground.image.path, (err, result) => err ? reject(err) : resolve(result));
        }).then((filePath) => {
            loaderContext.addDependency(filePath);

            const item = {
                id: 'ID' + utils.genMD5(oldBackground.toString()),
                filePath,
                oldBackground,
                blockSize: {
                    width: undefined,
                    height: undefined,
                },
                background: undefined,
            };

            const groupName = oldBackground.image.query[queryParam] === true ? defaultName : oldBackground.image.query[queryParam];
            if (!data[groupName])
                data[groupName] = {};
            if (!data[groupName][item.id])
                data[groupName][item.id] = item;

            // Check width & height
            rule.walkDecls((decl) => {
                if (decl.prop === 'width')
                    item.blockSize.width = decl.value;
                else if (decl.prop === 'height')
                    item.blockSize.height = decl.value;
            });

            // Clean source decls
            decls.forEach((decl) => decl.remove());
            rule.append({ prop: 'background', value: `CSS_SPRITE_LOADER_IMAGE('${groupName}', '${item.id}')` });
        }));
    });

    if (promises.length) {
        plugin.shouldGenerate = true;
        loaderContext._module.isCSSSpriteModule = true;
    }

    return Promise.all(promises);
});
