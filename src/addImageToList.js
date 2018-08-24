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

function generateHashFromRule(rule){
    let blockString = '';
    rule.walk((dec) => {
        blockString += (dec.prop + ':' + dec.value + ';');
    });
   	return 'cssRule-' + utils.md5Create(blockString);
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
		block.hash = hash;
		checkDivWidthHeight(parsedRule, block);
		block.images = images;
		cssBlockList[hash] = block;
		openSlotInCSSBlock(parsedRule, hash);
	}
}

module.exports = {
	addCSSBlockToList,
}