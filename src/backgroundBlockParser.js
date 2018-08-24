'use strict';

const css = require('postcss');
const valueParser = require('postcss-value-parser');
const backgroundParser = require('./backgroundParser.js');
const logger = require('./utils').logger;
// const BACKGROUND_REGEXP = /background/

// const BG_LAYER = /([^,]+),/;
// const FINAL_BG_LAYER = /([^,]+)$/;

// const BG_URL = /url\([\s"']*(.+\.(png|jpg|jpeg|gif)([^\s"']*))[\s"']*\)/i;
// const BG_IMAGE_SET = /(\-webkit\-)?image-set\([^\)]+\)/;
// const BG_IMAGE = new RegExp(`/(none|${BG_URL_REG.toString()}|${BG_IMAGE_SET.toString()}|)/`);

// const BG_SIZE = /(left|center|right|top|bottom|)/
//const background
const BG_IMAGE_SET = /(?:\-webkit\-)?image-set\((.+x)\)/;

const defaultBackground = {
	image: '',
	position: '',
	size: '',
	repeat: '',
	attachment: '',
	clip: '',
	origin: '',
	color: '',
	imageSet: [],
}
const backgroundKeys = Object.keys(defaultBackground);

function resolveBackgroundNode(decl, backgroundNomalized){
	// logger(decl.prop, decl.value);
	// const bglayers = decl.value.split(',');
	// console.log(bglayers);
	const parsed = valueParser(decl.value);
	const bgParser = new backgroundParser();
	const test = [];
	parsed.walk(node => {
		//logger(node.type, node.value);
		//test.push({type:node.type, value: node.value});
		bgParser.handleInput(node.type, node.value);
	})
	//logger('test', test)
	let nomalizeLine = bgParser.result.reduce((accu, res) => {
		const ks = Object.keys(res);
		ks.forEach(k => {
			if(!accu[k]) accu[k] = '';
			if(Array.isArray(res[k])){
				accu[k] += accu[k] ? joinParam(reWriteImageset(res[k])) : reWriteImageset(res[k]);
			}else{
				if(k === 'image'){
					accu[k] += accu[k] ? joinParam(reWriteUrl(res[k])) : reWriteUrl(res[k]);
				}else if(k === 'box'){
					const boxArr = res[k].split(' ');
					if(boxArr.length === 1){
						if(accu.clip) accu.clip += joinParam(boxArr[0]);
						else accu.clip = boxArr[0];

						if(accu.origin) accu.origin += joinParam(boxArr[0]);
						else accu.origin = boxArr[0];
					}
					if(boxArr.length === 2) {
						if(accu.clip) accu.clip += joinParam(boxArr[0]);
						else accu.clip = boxArr[0];

						if(accu.origin) accu.origin += joinParam(boxArr[1]);
						else accu.origin = boxArr[1];									
					}
				}else{
					accu[k] += accu[k] ? joinParam(res[k]) : res[k];
				}
				
			}
		});
		return accu;
	}, {});
	nomalizeLine = Object.assign({}, defaultBackground, nomalizeLine)
	// 暂时还不支持多张背景图片的情况
	backgroundKeys.forEach(k => {
		//if(nomalizeLine[k]){
			if(k === 'imageSet') return;
			if(k === 'image'){
				var reg = BG_IMAGE_SET.exec(nomalizeLine[k]);
				if(reg){
					backgroundNomalized.imageSet = reg[1].split(',');
					//logger('imageSet', reg[1].split(','))
				}else{
					backgroundNomalized[k] = nomalizeLine[k];
				}
			}else{
				backgroundNomalized[k] = nomalizeLine[k];
			}
			
		//}
	});

	// logger('backgroundNomalized', backgroundNomalized);
	//logger(decl.prop, val)

}

function reWriteImageset(sets){
	return `-webkit-image-set(${sets.join(',')})`
}

function reWriteUrl(url){
	return `url(${url})`
}

function joinParam(param) {
	return `, ${param}`;
}

function backgroundBlockParser(rule){
	const backgroundNomalized = Object.assign({}, defaultBackground);
	rule.walkDecls(/^background/, decl => {
		const p = decl.prop;
		//logger(p, decl.value);

		backgroundKeys.forEach(k => {
			const r = new RegExp(k);
			if(r.test(p)) {
				if(/image-set/.test(decl.value)){
					const reg = webkitRegExp.exec(urlStr);
					backgroundNomalized.imageSet = reg[1].split(',');
				}else{
					backgroundNomalized[k] = decl.value;
				}
			}
		});
		if(/^background$/.test(p)) {
			resolveBackgroundNode(decl, backgroundNomalized);
			// logger(rule.selector, backgroundNomalized)
		}
		//backgroundNomalized.decl = decl;
	});
	//logger('backgroundNomalized', backgroundNomalized)
	backgroundNomalized.ruleRegion = rule;
	return backgroundNomalized;
}

function openSlotInCSSBlock(parsedRule, slot){
	const rule = parsedRule.ruleRegion;
	rule.walkDecls(/^background/, decl => {
        decl.remove();
    });
    rule.append({prop: 'background', value: slot });
}

function rewriteImageSet(set){
	return set.reduce((accu, u, i) => (accu += `${i!=0?',':''}${u}`), '');
}

function rewriteBackgroundDecl(parsedRule){
	let css = '';
	let imageSet = ''
    for(const k in parsedRule){
        const val = parsedRule[k];
        
        if(val){
        	if(k === 'ruleRegion' || k ==='imageSetSize') continue;
        	if(!!!val) continue;
        	// TODO 其他过滤
			if(k === 'imageSet'){
				if(val.length === 0) continue;
				imageSet = `background-image: -webkit-image-set(${rewriteImageSet(val)});`
				continue;
			}
			if(k === 'image'){
				css += `background-${k}: url(${val});`
				continue;
			}
			css += `background-${k}: ${val};`
        }
    }
    css += imageSet;
    return css;
}

module.exports = {
	backgroundBlockParser,
	rewriteBackgroundDecl,
	openSlotInCSSBlock,
};