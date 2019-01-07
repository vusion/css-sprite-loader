const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');
const utils = require('./utils');

function addCSSBlockToList(parsedRule, images, cssBlockList, openSlotInCSSBlock) {
    const hash = generateHashFromRule(parsedRule.ruleRegion);
    const isNeedMerge = images.find((img) => img.merge);
    if (isNeedMerge) {
        const block = {};
        block.parsedRule = parsedRule;
        // 此CSS block的哈希值
        const uniqueHash = `cssRule-${hash}`;
        block.hash = uniqueHash;
        utils.logger('addCSSBlockToList', parsedRule.selector, parsedRule.imageSetMeta, parsedRule.imageSet);
        if (parsedRule.imageSetMeta) {
            block.hashMediaQ = parsedRule.imageSetMeta.reduce((accu, meta) => {
                accu[meta.group] = `mediaQ${meta.group}-${hash}`;
                return accu;
            }, {});
        }

        checkDivWidthHeight(parsedRule, block);
        saveSizeAndPostion(parsedRule);
        block.images = images;
        cssBlockList[uniqueHash] = block;
        openSlotInCSSBlock(parsedRule, uniqueHash);
    }
}

module.exports = {
    addCSSBlockToList,
};
