const BG_URL_REG = /url\([\s"']*(.+\.(png|jpg|jpeg|gif)([^\s"']*))[\s"']*\)/i;

function analysisBackground(parsedRule, context){
	const {
		image,
		position,
		size,
		repeat,
		attachment,
		clip,
		origin,
		color,
		imageSet
	} = parsedRule;

	const UsingThisLoader = !!image || imageSet.length !== 0;
	if(!UsingThisLoader) return;

    const result = {
        name: image,
    };

	if(!!image){
		// resolve image with url
		const reg = BG_URL_REG.exec(image);
		const params = reg[1].split('?')[1];
		result.params = params;
	}

	if(imageSet.length !== 0) {
		
	}
	

}

module.exports = analysisBackground;