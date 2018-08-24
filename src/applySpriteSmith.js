const path = require('path');
const SpriteSmith = require('spritesmith');

const utils = require('./utils');
const logger = utils.logger;
const PADDING = 20;

class SpriteSmithWrapper{
	constructor(options){
		this.options = options
	}

    apply(cssBlockList, compilation){
        const queryParam = this.options.queryParam;
        const imgList = {};
        Object.keys(cssBlockList).forEach(k => {
            const cssblock = cssBlockList[k];
            const cssblockHash = cssblock.hash;
            const images = cssblock.images;
            images.forEach((image) => {
                const belongs = image[queryParam];
                if(!belongs) return;
                const path = image.path;
                if(!imgList[belongs]) 
                    imgList[belongs] = {};

                const imgSet = imgList[belongs];
                if(!imgSet[path])
                    imgSet[path] = [ cssblockHash ];
                else
                    imgSet[path].push(cssblockHash);
            })
        }, {});

        // logger('imgList', imgList);
        const cssBlockLock = {};
        return Object.keys(imgList).map(target => {
            const sourceList = Object.keys(imgList[target])
            const targetFile = target + '.png';
            let imageUrl = '/';
            if (this.options.publicPath)
                imageUrl = utils.urlResolve(this.options.publicPath, targetFile);
            else
                imageUrl = utils.urlResolve(compilation.options.output.publicPath || '', path.join(this.options.output, targetFile));
            
            return new Promise((res, rej) => {
                    SpriteSmith.run({
                        src: sourceList,
                        algorithm: 'binary-tree',
                        padding: this.options.padding,
                    }, (err, result) => {
                        if (err)
                            rej(err);
                        else {
                            res(result);
                        }
                    });
                }).then(result => {
                    // logger('SpriteSmith', result);
                    compilation.assets[path.join(this.options.output, target + '.png')] = {
                        source: () => result.image,
                        size: () => result.image.length,
                    };
                    const {
                        coordinates,
                        properties,
                        image
                    } = result;
                    const spriteHash = utils.md5Create(result.image);
                    const { width, height } = properties;
                    Object.keys(coordinates).forEach(path => {
                        const spriteMeta = coordinates[path];
                        const imgSet = imgList[target];
                        const cssblockTargetList = imgSet[path];
                        cssblockTargetList.forEach(blockhash => {
                            const block = cssBlockList[blockhash];

                            if(block.parsedRule && !cssBlockLock[blockhash]){
                                cssBlockLock[blockhash] = true;
                                logger('cssblock', block.parsedRule.image)
                                const { divWidth, divHeight } = block;
                                let { size, position, imageSet } = block.parsedRule;
                                logger('origin', size , position, divWidth, divHeight)
                                if(!size) {
                                    size = [spriteMeta.width, spriteMeta.height];
                                }else if(/auto/.test(size)){
                                    /*size = size.split(' ').map((s) => {
                                        return /auto/.test(s)? spriteMeta.width : s;
                                    }).join(' ');*/
                                    const sz = size.split(' ');
                                    if(sz.length === 2){
                                        if(!/auto/.test(sz[1])){
                                            const num = utils.unit2Number(sz[1]);
                                            size = [num / spriteMeta.height * spriteMeta.width, num]
                                        }else if(!/auto/.test(sz[0])){
                                            const num = utils.unit2Number(sz[0]);
                                            size = [num, num / spriteMeta.width * spriteMeta.height]
                                        }else{
                                            size = [spriteMeta.width, spriteMeta.height];
                                        }
                                    }

                                     
                                }else{
                                    size = utils.str2NumArray(size, divWidth, divHeight);   
                                }

                                if(!position){
                                    position = [0, 0]
                                }else{
                                    position = utils.str2NumArray(position, divWidth, divHeight); 
                                }

                                
                                const ratioX = size[0] / spriteMeta.width;
                                const ratioY = size[1] / spriteMeta.height;

                                if(imageSet.length > 0){
                                    block.parsedRule.imageSetSize = `${spriteMeta.width * ratioX}px ${spriteMeta.height * ratioY}px`;
                                }

                                // logger('before', size , position, ratioX, ratioY, spriteMeta, width, height)

                                const sizeAfterW = width * ratioX;
                                const sizeAfterH = height * ratioY;

                                const positionAfterX = -spriteMeta.x * ratioX + position[0];
                                const positionAfterY = -spriteMeta.y * ratioY + position[1];

                                block.parsedRule.size = `${sizeAfterW}px ${sizeAfterH}px`;
                                block.parsedRule.position = `${positionAfterX}px ${positionAfterY}px`
                                // logger('after', block.parsedRule.size , block.parsedRule.position)
                                // logger('after', block.parsedRule.size  , block.parsedRule.position)
                                
                            }

                            const { image, imageSet } = block.parsedRule;
                            // logger('parsedRule before', blockhash, imageSet, image, imageUrl);
                            if(path === image){
                                block.parsedRule.image = imageUrl;
                            }
                            if(imageSet){
                                block.parsedRule.imageSet = imageSet.map((i) => {
                                    
                                    if(i.indexOf(path) !== -1){
                                        return `url(${imageUrl}) ${i.split(' ')[1]}`
                                    }
                                    return i;
                                });
                            }
                            // logger('parsedRule after', block.parsedRule);

                            //logger('imageSet', block.parsedRule.imageSet);
                        });

                    })

                });
            
        })
    }
}
module.exports = SpriteSmithWrapper;