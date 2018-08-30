const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');
const utils = require('./utils');

function checkDivWidthHeight(parsedRule, block) {
	const rule = parsedRule.ruleRegion;
    if (rule) {
        rule.walkDecls('width', (declaration) => {
            if (declaration) {
                block.divWidth = declaration.value;
            }
        });
        rule.walkDecls('height', (declaration) => {
            if (declaration) {
                block.divHeight = declaration.value;
            }
        });
    }
}
function saveSizeAndPostion(parsedRule){
    parsedRule.sizeOrigin = parsedRule.size;
    parsedRule.positionOrigin = parsedRule.position;
}

function generateHashFromRule(rule){
    let blockString = '';
    rule.walk((dec) => {
        blockString += (dec.prop + ':' + dec.value + ';');
    });
   	return utils.md5Create(blockString);
}

function addCSSBlockToList(parsedRule, images, cssBlockList, openSlotInCSSBlock){
	const hash = generateHashFromRule(parsedRule.ruleRegion);
	const isNeedMerge = images.find(img => {
		return img.merge;
	})
	if(isNeedMerge){
		const block = {};
		block.parsedRule = parsedRule;
		// 此CSS block的哈希值
        const uniqueHash = `cssRule-${hash}`;
		block.hash = uniqueHash;
        utils.logger('addCSSBlockToList', parsedRule.selector, parsedRule.imageSetMeta, parsedRule.imageSet)
        if(parsedRule.imageSetMeta){
            block.hashMediaQ = parsedRule.imageSetMeta.reduce((accu, meta) => { 
                accu[meta.group] = `mediaQ${meta.group}-${hash}`;
                return accu;
            }, {})        
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
}