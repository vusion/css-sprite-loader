const postcss = require('postcss');
const { utils } = require('base-css-image-loader');
const meta = require('./meta');
const { default: CSSFruit, Background, URL } = require('css-fruit');

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
        return `
@media (-webkit-min-device-pixel-ratio: ${dppx}), (min-resolution: ${dppx}dppx) {
    ${selector} {
        ${content}
    }
}
`;
    } else if (resolution < defaultResolution) {
        return `
@media (-webkit-max-device-pixel-ratio: ${dppx}), (max-resolution: ${dppx}dppx) {
    ${selector} {
        ${content}
    }
}
`;
    }
}

module.exports = postcss.plugin('css-sprite-parser', ({ loaderContext }) => (styles, result) => {
    const promises = [];
    const plugin = loaderContext[meta.PLUGIN_NAME];
    const options = plugin.options;
    const data = plugin.data;

    let imageSetFallback = options.imageSetFallback;
    if (imageSetFallback === true)
        imageSetFallback = { preserve: true };

    styles.walkRules((rule) => {
        const decls = rule.nodes.filter((node) => node.type === 'decl' && node.prop.startsWith('background'));
        if (!decls.length)
            return;

        /**
         * Core variable 0
         */
        const oldBackground = CSSFruit.absorb(decls);
        if (!oldBackground.valid) {
            rule.warn(result, 'Invalid background');
            return;
        }

        if (!oldBackground.image)
            return;

        // For browsers
        if (oldBackground.image._type === 'image-set')
            oldBackground.image.prefix = '-webkit-';
        const oldBackgroundString = oldBackground.toString();

        /**
         * Core variable 1
         */
        const ruleItem = {
            id: 'ID' + utils.genMD5(oldBackgroundString),
            defaultResolution: '1x',
        };

        /**
         * Core variable 2
         */
        const imageSet = [];
        let oldResolutions;
        if (oldBackground.image._type === 'url') {
            imageSet.push({
                url: oldBackground.image,
                src: undefined,
                resolution: undefined,
                needSprite: false,
                groupName: undefined,
            });
        } else if (oldBackground.image._type === 'image-set') {
            oldResolutions = Object.keys(oldBackground.image.values);
            oldResolutions.forEach((resolution) => {
                imageSet.push({
                    url: oldBackground.image.values[resolution],
                    src: undefined,
                    resolution,
                    needSprite: false,
                    groupName: undefined,
                });
            });
        } else
            return; // Other type like linear-gradient

        // Check whether need sprite
        const checkWhetherNeedSprite = (url) => {
            if (!url.path.endsWith('.png'))
                return false;
            if (options.filter === 'query')
                return !!(url.query && url.query[options.queryParam]);
            else if (options.filter instanceof RegExp)
                return options.filter.test(url.path);
            else if (options.filter === 'all')
                return true;
            else
                throw new TypeError(`Unknow filter value '${options.filter}'`);
        };

        let someNeedSprite = false;
        imageSet.forEach((image) => {
            image.needSprite = checkWhetherNeedSprite(image.url);
            if (image.needSprite)
                someNeedSprite = image.needSprite;
        });

        if (!someNeedSprite && !(oldBackground.image._type === 'image-set' && imageSetFallback))
            return;

        // Fill image object, add retina image in imageSet
        if (oldBackground.image._type === 'url') {
            const image = imageSet[0];
            const query = image.url.query;
            const baseGroupName = query && typeof query[options.queryParam] === 'string' ? query[options.queryParam] : options.defaultName;
            image.src = image.url.path;

            // According to query retina, collect image set
            const pathRE = /(^.*?)(?:@(\d+x))?\.png$/;
            const paramRE = /^retina@?(\d+x)$/;
            const found = image.url.path.match(pathRE);
            if (!found)
                throw new Error('Error format of filePath');
            let [, basePath, defaultResolution] = found;
            if (!defaultResolution)
                defaultResolution = '1x';
            // 路径本身指示默认分辨率
            image.groupName = baseGroupName;
            image.resolution = ruleItem.defaultResolution = defaultResolution;

            Object.keys(query).forEach((param) => {
                // @compat: old version
                if (param === 'retina')
                    param = 'retina@2x';

                const found = param.match(paramRE);
                if (!found)
                    return;

                const resolution = found[1];
                const url = new URL(image.url.toString());
                url.path = `${basePath}@${resolution}.png`;
                imageSet.push({
                    url,
                    src: url.path,
                    resolution,
                    needSprite: image.needSprite,
                    groupName: `${baseGroupName}@${resolution}`,
                });
            });
        } else if (oldBackground.image._type === 'image-set') {
            imageSet.forEach((image, index) => {
                const query = image.url.query;
                const baseGroupName = query && typeof query[options.queryParam] === 'string' ? query[options.queryParam] : options.defaultName;
                image.src = image.url.path;
                image.groupName = `${baseGroupName}@${image.resolution}`;

                if (index === 0) {
                    // 第一项指示默认分辨率
                    image.groupName = baseGroupName;
                    ruleItem.defaultResolution = image.resolution;
                }
            });
        }

        /**
         * Core variable 3
         */
        const blockSize = {
            width: undefined,
            height: undefined,
        };
        // Check width & height
        rule.walkDecls((decl) => {
            if (decl.prop === 'width')
                blockSize.width = decl.value;
            else if (decl.prop === 'height')
                blockSize.height = decl.value;
        });

        promises.push(Promise.all(imageSet.map((image) => new Promise((resolve, reject) => {
            loaderContext.resolve(loaderContext.context, image.src, (err, result) => err ? reject(err) : resolve(result));
        }))).then((filePaths) => {
            // Clean decls in source
            decls.forEach((decl) => decl.remove());

            const outputs = [];
            filePaths.forEach((filePath, index) => {
                if (!filePath)
                    throw new Error(`Cannot resolve file path '${imageSet[index].src}'`);
                loaderContext.addDependency(filePath);

                const image = imageSet[index];
                const groupItem = {
                    id: ruleItem.id,
                    groupName: image.groupName,
                    filePath,
                    oldBackground,
                    blockSize,
                    resolution: image.resolution,
                    content: undefined, // new background cached
                };

                let content = `${meta.REPLACER_NAME}(${image.groupName}, ${groupItem.id})`;
                if (image.needSprite) {
                    if (!data[image.groupName])
                        data[image.groupName] = {};
                    // background 的各种内容没变，id 一定不会变
                    if (!data[image.groupName][groupItem.id])
                        data[image.groupName][groupItem.id] = groupItem;
                } else {
                    const background = new Background(oldBackgroundString);
                    background.image = image.url;
                    content = background.toString();
                }

                if (image.resolution === ruleItem.defaultResolution)
                    rule.append({ prop: 'background', value: content });
                else {
                    // No problem in async function
                    outputs.push(genMediaQuery(image.resolution, ruleItem.defaultResolution, rule.selector, `background: ${content};`));
                }
            });

            if (oldBackground.image._type === 'image-set' && !someNeedSprite && imageSetFallback.preserve)
                outputs.push(`
${rule.selector} {
    background: ${oldBackgroundString};
}
`);
            if (outputs.length)
                rule.after(outputs.join(''));
        }));
    });

    if (promises.length) {
        plugin.shouldGenerate = true;
        loaderContext._module[meta.MODULE_MARK] = true;
    }

    return Promise.all(promises);
});
