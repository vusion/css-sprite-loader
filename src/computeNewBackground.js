const { Background, BackgroundPosition, BackgroundSize, Percentage, Length } = require('css-fruit');

function checkBlockSize(blockSize) {
    if (blockSize.valid)
        return true;
    if (blockSize.width._type === 'length' && blockSize.height._type === 'length')
        return true;
    if ((blockSize.width.unit === 'px' || blockSize.width.toString() === '0')
        && (blockSize.height.unit === 'px' || blockSize.height.toString() === '0'))
        return true;
    throw new TypeError(`Only support px-unit in block width or height when using 'background-size'`);
}

function checkBackgroundPosition(position) {
    // top right center ...
    if (position.x.offset._type === 'length' && position.y.offset._type === 'length')
        return true;
    if ((position.x.offset.unit === 'px' || position.x.offset.toString() === '0')
        && (position.y.offset.unit === 'px' || position.y.offset.toString() === '0'))
        return true;
    throw new TypeError(`Only support px-unit in 'background-position'`);
}

/**
 *
 * @param {Background} oldBackground
 * @param {no units -> Length} blockSize
 * @param {no units} imageDimension
 * @param {no units} spriteSize
 * @param {number} dppx
 */
module.exports = function computeNewBackground(oldBackground, url, blockSize, imageDimension, spriteSize, dppx) {
    const background = new Background();
    background.color = oldBackground.color;
    background.repeat = 'no-repeat';
    background.image = `url('${url.replace(/'/g, "\\'")}')`;
    // background.clip
    // background.origin
    // background.attachment
    background.valid = true;

    // background-position
    if (oldBackground.position === undefined)
        oldBackground.position = new BackgroundPosition('0px 0px');
    else
        checkBackgroundPosition(oldBackground.position);
    background.position = new BackgroundPosition(`0px 0px`);
    background.position.x.offset.number = oldBackground.position.x.offset.number - imageDimension.x;
    background.position.y.offset.number = oldBackground.position.y.offset.number - imageDimension.y;

    // background-size
    let oldSize = oldBackground.size;
    if (String(oldSize) === 'auto')
        oldSize = undefined;
    if (!oldSize && dppx !== 1) {
        oldSize = new BackgroundSize(imageDimension.width / dppx + 'px' + ' ' + imageDimension.height / dppx + 'px');
    }

    if (oldSize) { // Don't process 'auto'
        blockSize = new BackgroundSize((blockSize.width || (imageDimension.width + 'px')) + ' ' + (blockSize.height || (imageDimension.width + 'px')));

        const spriteRadio = {
            x: 1,
            y: 1,
        };

        const blockWHRatio = blockSize.width.number / blockSize.height.number;
        const imageWHRatio = imageDimension.width / imageDimension.height;

        /**
         * cover or contain amounts to ...
         *
         * |         | bWHRatio >= iWHRatio | bWHRatio < iWHRatio |
         * | ------- | -------------------- | ------------------- |
         * | cover   | 100% auto            | auto 100%           |
         * | contain | auto 100%            | 100% auto           |
         */

        if ((oldSize.toString() === 'cover' && blockWHRatio >= imageWHRatio)
            || (oldSize.toString() === 'contain' && blockWHRatio < imageWHRatio)) {
            oldSize = new BackgroundSize('100% auto');
        }
        if ((oldSize.toString() === 'cover' && blockWHRatio < imageWHRatio)
            || (oldSize.toString() === 'contain' && blockWHRatio >= imageWHRatio)) {
            oldSize = new BackgroundSize('auto 100%');
        }

        // Handle case of width
        if (oldSize.width._type === 'percentage') {
            checkBlockSize(blockSize);
            spriteRadio.x = blockSize.width.number * oldSize.width.number * 0.01 / imageDimension.width;
        } else if (oldSize.width._type === 'length') {
            if (oldSize.width.unit !== 'px')
                throw new Error(`Only support px-unit or percentage in 'background-size'`);
            spriteRadio.x = oldSize.width.number / imageDimension.width;
        }

        // Handle case of height
        if (oldSize.height._type === 'percentage') {
            checkBlockSize(blockSize);
            spriteRadio.y = blockSize.height.number * oldSize.height.number * 0.01 / imageDimension.height;
        } else if (oldSize.height._type === 'length') {
            if (oldSize.height.unit !== 'px')
                throw new Error(`Only support px-unit or percentage in 'background-size'`);
            spriteRadio.y = oldSize.height.number / imageDimension.height;
        }

        // Handle case of auto
        if (oldSize.width === 'auto')
            spriteRadio.x = spriteRadio.y;
        else if (oldSize.height === 'auto')
            spriteRadio.y = spriteRadio.x;

        background.size = new BackgroundSize(
            (spriteSize.width * spriteRadio.x).toFixed(0) + 'px',
            (spriteSize.height * spriteRadio.y).toFixed(0) + 'px',
        );

        background.position.x.offset.number = oldBackground.position.x.offset.number - (imageDimension.x * spriteRadio.x).toFixed(0);
        background.position.y.offset.number = oldBackground.position.y.offset.number - (imageDimension.y * spriteRadio.y).toFixed(0);
    }

    return background;
};
