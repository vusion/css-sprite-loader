const util = require('./utils');

function generateHashFromRule(rule){
    let blockString = '';
    rule.walk((dec) => {
        blockString += (dec.prop + ':' + dec.value + ';');
    });
   	return 'image-' + utils.md5Create(blockString);
}

function addImageToList(parsedRule, images, rule){
	const hash = generateHashFromRule(rule);
	if (image.merge) {
		
	}
}