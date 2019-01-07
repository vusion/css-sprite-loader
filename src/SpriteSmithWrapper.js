const path = require('path');
const SpriteSmith = require('spritesmith');

const utils = require('./utils');
const logger = utils.logger;
const PADDING = 20;

class SpriteSmithWrapper {
    constructor(options) {
        this.options = options;
    }

    apply(cssBlockList, compilation) {
        const queryParam = this.options.queryParam;
        const imgList = {};
        Object.keys(cssBlockList).forEach((k) => {
            const cssblock = cssBlockList[k];
            const cssblockHash = cssblock.hash;
            const images = cssblock.images;
            images.forEach((image) => {
                const belongs = image[queryParam];
                if (!belongs)
                    return;
                const path = image.path;
                if (!imgList[belongs])
                    imgList[belongs] = {};

                const imgSet = imgList[belongs];
                if (!imgSet[path])
                    imgSet[path] = [cssblockHash];
                else
                    imgSet[path].push(cssblockHash);
            });
        }, {});

        // logger('imgList', imgList);
        const cssBlockLock = {};
        return Object.keys(imgList).map((target) => {
            const sourceList = Object.keys(imgList[target]);
            const targetFile = target + '.png';
            let imageUrl = '/';
            if (this.options.publicPath)
                imageUrl = utils.urlResolve(this.options.publicPath, targetFile);
            else
                imageUrl = utils.urlResolve(compilation.options.output.publicPath || '', path.join(this.options.output, targetFile));


                // logger('SpriteSmith', result);
                compilation.assets[path.join(this.options.output, target + '.png')] = {
                    source: () => result.image,
                    size: () => result.image.length,
                };
                const {
                    coordinates,
                    properties,
                    image,
                } = result;
                const spriteHash = utils.md5Create(result.image);
                const { width, height } = properties;
                Object.keys(coordinates).forEach((path) => {
                    const spriteMeta = coordinates[path];
                    const imgSet = imgList[target];
                    const cssblockTargetList = imgSet[path];
                    cssblockTargetList.forEach((blockhash) => {
                        const block = cssBlockList[blockhash];

                        if (block.parsedRule && !cssBlockLock[blockhash]) {
                            cssBlockLock[blockhash] = true;
                            // logger('cssblock', block.parsedRule.image)
                            const {
                                size,
                                position,
                            } = calcSizeAndPosition(block, spriteMeta, width, height);

                            block.parsedRule.size = size;
                            block.parsedRule.position = position;
                            // logger('after', block.parsedRule.size , block.parsedRule.position)
                            // logger('after', block.parsedRule.size  , block.parsedRule.position)
                        }

                        const { image, imageSet } = block.parsedRule;
                        // logger('parsedRule before', blockhash, imageSet, image, imageUrl);
                        if (path === image) {
                            block.parsedRule.image = imageUrl;
                        }
                        if (imageSet && imageSet.length > 0) {
                            logger('imageSet', imageSet);
                            logger('spriteMeta', spriteMeta, width, height);
                            block.parsedRule.imageSet = imageSet.map((i) => {
                                if (typeof i === 'string' && i.indexOf(path) !== -1) {
                                    const mediaQ = i.split(' ')[1];
                                    const multiply = Number(/(\d)x/.exec(mediaQ)[1]);

                                    const spriteMetaResized = Object.keys(spriteMeta).reduce((accu, k) => {
                                        accu[k] = spriteMeta[k] / multiply;
                                        return accu;
                                    }, {});
                                    logger('spriteMetaResized', spriteMetaResized);
                                    const {
                                        size,
                                        position,
                                    } = calcSizeAndPosition(block, spriteMetaResized, width / multiply, height / multiply);
                                    const set = {
                                        image: `url(${imageUrl})`,
                                        mediaQ,
                                        size,
                                        position,
                                    };
                                    logger('imageSet parsed', set);
                                    return set;
                                    // return `url(${imageUrl}) ${i.split(' ')[1]}`
                                }
                                return i;
                            });
                        }
                        // logger('parsedRule after', block.parsedRule);

                        // logger('imageSet', block.parsedRule.imageSet);
                    });
                });
            });
        });
    }
}

function calcSizeAndPosition(block, spriteMeta, spriteWidth, spriteHight) {
    let { divWidth, divHeight } = block;
    divWidth = utils.unit2Number(divWidth);
    divHeight = utils.unit2Number(divHeight);
    let { sizeOrigin, positionOrigin } = block.parsedRule;
    logger('initial', sizeOrigin, positionOrigin);
    if (!sizeOrigin) {
        sizeOrigin = [spriteMeta.width, spriteMeta.height];
    } else if (/auto/.test(sizeOrigin)) {
        const sz = sizeOrigin.split(' ');
        if (sz.length === 2) {
            if (!/auto/.test(sz[1])) {
                const num = utils.unit2Number(sz[1]);
                sizeOrigin = [num / spriteMeta.height * spriteMeta.width, num];
            } else if (!/auto/.test(sz[0])) {
                const num = utils.unit2Number(sz[0]);
                sizeOrigin = [num, num / spriteMeta.width * spriteMeta.height];
            } else {
                sizeOrigin = [spriteMeta.width, spriteMeta.height];
            }
        }
    } else if (/cover/.test(sizeOrigin)) {
        const rx = divWidth / spriteMeta.width;
        const ry = divHeight / spriteMeta.height;
        if (rx > ry) {
            sizeOrigin = [divWidth, spriteMeta.height * rx];
        } else {
            sizeOrigin = [spriteMeta.width * ry, divHeight];
        }
    } else if (/contain/.test(sizeOrigin)) {
        const rx = divWidth / spriteMeta.width;
        const ry = divHeight / spriteMeta.height;
        if (rx > ry) {
            sizeOrigin = [spriteMeta.width * ry, divHeight];
        } else {
            sizeOrigin = [divWidth, spriteMeta.height * rx];
        }
    } else {
        sizeOrigin = utils.str2NumArray(sizeOrigin, divWidth, divHeight);
    }

    if (!positionOrigin) {
        positionOrigin = [0, 0];
    } else {
        positionOrigin = utils.str2NumArray(positionOrigin, divWidth, divHeight);
    }

    logger('size', sizeOrigin);

    const ratioX = sizeOrigin[0] / spriteMeta.width;
    const ratioY = sizeOrigin[1] / spriteMeta.height;

    const sizeAfterW = spriteWidth * ratioX;
    const sizeAfterH = spriteHight * ratioY;

    const positionAfterX = -spriteMeta.x * ratioX + positionOrigin[0];
    const positionAfterY = -spriteMeta.y * ratioY + positionOrigin[1];

    return {
        size: `${sizeAfterW}px ${sizeAfterH}px`,
        position: `${positionAfterX}px ${positionAfterY}px`,
    };
}
module.exports = SpriteSmithWrapper;
