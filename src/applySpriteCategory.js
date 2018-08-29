const logger = require('./utils').logger;
const BG_URL_REG = /url\([\s"']*(.+\.(png|jpg|jpeg|gif)([^\s"']*))[\s"']*\)/i;
const BG_URL_REG_GROUP = /url\([\s"']*(.+\.(png|jpg|jpeg|gif)([^\s"']*))[\s"']*\)\s(\dx)/i;

function applySpriteCategory(parsedRule, queryParam, defaultName, filter){
	const {
		image,
		// position,
		// size,
		// repeat,
		// attachment,
		// clip,
		// origin,
		// color,
		imageSet
	} = parsedRule;

	const promises = [];

	if(!!image){
		// resolve image with url
		const reg = BG_URL_REG.exec(image);
		const parts = reg[1].split('?');
		const obj = {
	        name: image,
	        url: parts[0],
	        params: !!parts[1] && parts[1],
	        imageSet: false,
	    };
	    promises.push(new Promise((resolve, reject) => {
	        // This path must be resolved by webpack.

	        this.resolve(this.context, obj.url, (err, result) => {
	        	parsedRule.image = `${result}`;
	        	err ? reject(err) : resolve(Object.assign({}, obj, {path: result}))
	        });
	    }))
	}

	if(imageSet.length !== 0) {
		const imageSetMeta = imageSet
			.map(url => BG_URL_REG_GROUP.exec(url))
			.map(reg => {
	            return {
	                url: reg[1],
	                group: reg[4]
	            }
	        })        
	        .map(obj => {
	            const parts = obj.url.split("?");
	            return {
	                name: `url(${obj.url})`,
	                url: parts[0],
	                params: parts[1],
	                imageSet: true,
	                group: obj.group,
	            }
	        });


        imageSetMeta.forEach((obj, i) => {
        	const { group } = obj;
        	promises.push(new Promise((resolve, reject) => {
            	this.resolve(this.context, obj.url, (err, result) => {
            		imageSet[i] = `${result} ${group}`;
            		//logger(i, imageSet[i]);
            		err ? reject(err) : resolve(Object.assign({}, obj, {path: result}))
            	});
        	}));
        });

        parsedRule.imageSetMeta = imageSetMeta;
	}
	return Promise.all(promises).then(arr => {
		return arr.map(img => {
			const {name, url, params, group, path, imageSet} = img;
			const result = {name, url, path, imageSet};
			if(group) result.group = group;
			let needMerge = false;
			if (params) {
				const paramsAst = params.split('&');
            	paramsAst.forEach((item) => {
            		const param = item.split('=');
                    if (filter === 'query') {
                        if (param[0] === queryParam)
                            needMerge = true;
                    } else if (filter === 'all')
                        needMerge = true;
                    else if (filter instanceof RegExp)
                        needMerge = filter.test(url);

                    result[param[0]] = param[1];
            	});
            	const spriteMerge = result[queryParam];
	            if (spriteMerge === undefined)
	                result[queryParam] = defaultName;
	            if(imageSet)
	            	result[queryParam] = applyImageSet(result[queryParam], group)
			}
			result.merge = needMerge;
			return result;
		})
	})

}
function applyImageSet(name, group){return `${name}${group === '1x'?'':`@${group}`}`};

module.exports = applySpriteCategory;