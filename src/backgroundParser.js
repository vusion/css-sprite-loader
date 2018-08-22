
// 状态变化
// url : function -> word -> space

// -webkit-image-set : function -> (url -> word (-> div)?)* -> space

// position : word -> space -> word

// size: div -> word -> space -> word

// repeat: word(repeat-x | repeat-y | [ repeat | space | round | no-repeat ]{1,2})

// attachment: word(scroll | fixed | local)

// box: word(border-box | padding-box | content-box) 
// origin -> space -> clip
// 一个值时，两个附为同一个

const BG_URL = /url/i;
const BG_IMAGE_SET = /(\-webkit\-)?image-set/;
//|(repeat|space|round|no\-repeat\b){1,2}
//const IMAGE_REPEAT = /^\b(repeat\-x|repeat\-y|(\b(repeat|space|round|no\-repeat)\b(?:\s\b(repeat|space|round|no\-repeat)\b)?))\b$/;

//const IMAGE_BOX = /^\b(border\-box|padding\-box|content\-box)\b(?:\s\b(border\-box|padding\-box|content\-box)\b)?$/;
const IMAGE_REPEAT = /^\b(repeat\-x|repeat\-y|repeat|space|round|no\-repeat)\b$/;
const IMAGE_ATTACHMENT = /^\b(scroll|fixed|local)\b$/;
const IMAGE_BOX = /^\b(border\-box|padding\-box|content\-box)\b$/;

const NUMBER = /\b\d+(?:\.\d+)?(cap|ch|em|ex|ic|lh|rem|rlh|vh|vw|vi|vb|vmin|vmax|px|cm|mm|Q|in|pc|pt)\b/;
const PERCENTAGE = /^(\d+(?:\.\d+)?%)$/;
// TODO 目前无法匹配到 .55px这样的写法，同时无法把百分比放入正则
const IMAGE_POSITION = /^\b(auto|left|center|right|top|bottom|0|(?:\b\d*(?:\.\d+)?(cap|ch|em|ex|ic|lh|rem|rlh|vh|vw|vi|vb|vmin|vmax|px|cm|mm|Q|in|pc|pt)\b))\b$/;

const NAMED_COLOR = /\b(black|silver|gray|white|maroon|red|purple|fuchsia|green|lime|olive|yellow|navy|blue|teal|aqua|orange|aliceblue|antiquewhite|aquamarine|azure|beige|bisque|blanchedalmond|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|aqua|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|gainsboro|ghostwhite|gold|goldenrod|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|limegreen|linen|magenta|fuchsia|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|oldlace|olivedrab|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|thistle|tomato|turquoise|violet|wheat|whitesmoke|yellowgreen|rebeccapurple)\b/
const COLOR = /^rbg|rbga|hsl|hsla|#/i

const closeLogger = true;
function logger(title){
    if(closeLogger) return;
    console.log(`--------------${title}--------------`);
    Array.prototype.slice.call(arguments).slice(1).forEach((t) => console.log(t));
    console.log('------------------------------------');
}
class backgroundParser{
	constructor(){
		this.state = new GrandJudgeState();
		this.result = [{}];
		this.currBlock = 0;
		this.stateStack = [this.state];
	}

	handleInput(type, value){
		this.state.handleInput(this, type, value);
	}
	update(){
		this.state.update(this);
	}
	get prevState() {
		this.stateStack.pop();
		return this.stateStack[this.stateStack.length-1];
	}
	get currStyleSet() {
		if(!this.result[this.currBlock]) this.result[this.currBlock] = {};
		return this.result[this.currBlock];
	}
}


class parserState{
	handleInput(parser, type, value){   }
	update(parser) {}
}



class GrandJudgeState extends parserState{
	handleInput(parser, type, value){
		logger('GrandJudgeState', type, value)
		switch(type){
			case 'function':
				if(BG_URL.test(value)){
					parser.state = new URLState();
					parser.stateStack.push(parser.state);
				}
				if(BG_IMAGE_SET.test(value)){
					parser.state = new ImageSetState();
					parser.stateStack.push(parser.state);
				}
				break;
			case 'word':
				JudgeWord.handleInput(parser, type, value);
				break;
			case 'div':
				if(value === ','){
					parser.currBlock += 1;
				}
				if(value === '/'){
					parser.state = new ImageSizeState();
					parser.stateStack.push(parser.state);
				}
				break;
			//case 'space':

		}
	}
}
class URLState extends parserState{
	handleInput(parser, type, value){
		logger('URLState', type, value)
		switch(type){
			case 'word':	
				this.update(parser, value);
				break;
			case 'string':
				this.update(parser, value);
				break;
			case 'space':
				parser.state = parser.prevState;
				break;
		}
	}

	update(parser, value){
		const currSet = parser.currStyleSet;
		if(Array.isArray(currSet.image)) currSet.image.push(`url(${value})`);
		else currSet.image = value;
	}
}
class ImageSetState extends parserState{
	handleInput(parser, type, value){
		logger('ImageSetState', type, value)
		switch(type){
			case 'function':
				parser.state = new URLState();
				parser.stateStack.push(parser.state);
				this.touchImageList(parser);
				break;	
			case 'word':
				this.updatePower(parser, value);
				break;
			case 'div':
				parser.state = new URLState();
				parser.stateStack.push(parser.state);
				break;
			case 'space':
				parser.state = parser.prevState;
				break;
		}
	}
	touchImageList(parser){
		if(!parser.currStyleSet.image)
			parser.currStyleSet.image = [];
	}
	updatePower(parser, value){
		const imgArr = parser.currStyleSet.image;
		const img = imgArr[imgArr.length-1];
		imgArr[imgArr.length-1] = `${img} ${value}`;
	}
}


class JudgeWordState extends parserState{
	handleInput(parser, type, value){
		if(IMAGE_REPEAT.test(value)){
			this.update(parser, 'repeat', value);
			return;
		}
		if(IMAGE_ATTACHMENT.test(value)){
			this.update(parser, 'attachment', value);
			return;
		}
		if(IMAGE_BOX.test(value)){
			this.update(parser, 'box', value);
			return;
		}

		if(NAMED_COLOR.test(value) || COLOR.test(value)){
			this.update(parser, 'color', value);
		}

		parser.state = new ImagePositionState(parser);
		parser.stateStack.push(parser.state);
		parser.state.handleInput(parser, type, value);
	}

	update(parser, prop, value){
		const currSet = parser.currStyleSet;
		if(currSet[prop]) currSet[prop] += ' ';
		if(!currSet[prop]) currSet[prop] = '';
		currSet[prop] += value;
	}
}
const JudgeWord = new JudgeWordState();

class ImagePositionState extends parserState{
	constructor(){
		super();
		this.oops = false;
		this.counting = 0;
	}
	handleInput(parser, type, value){
		logger('ImagePositionState', type, value)
		if(IMAGE_POSITION.test(value) || PERCENTAGE.test(value)){
			this.update(parser, value);
			this.oops = false;
			this.counting += 1;
		}
		
		if(type === 'space'){
			this.oops = true;
		}

		if (type !== 'space' && this.oops) {
			parser.state = parser.prevState;
			parser.state.handleInput(parser, type, value);
		}

		if(this.counting === 2){
			parser.state = parser.prevState;
		}
	}

	update(parser, value){

		const currSet = parser.currStyleSet;
		if(currSet.position) currSet.position += ' ';
		if(!currSet.position) currSet.position = '';
		currSet.position += value;
		logger('update ImagePosition to ', currSet.position)
	}
}

class ImageSizeState extends parserState{
	constructor(){
		super();
		this.counting = 0;
		this.oops = false;
	}
	handleInput(parser, type, value){
		logger('ImageSizeState', type, value)
		if(NUMBER.test(value) || PERCENTAGE.test(value)){
			this.update(parser, value);
			this.oops = false;
			this.counting += 1;
		}
		if(type === 'space'){
			this.oops = true;
		}
		if (type !== 'space' && this.oops) {
			parser.state = parser.prevState;
			parser.state.handleInput(parser, type, value);
		}
		if(this.counting === 2){
			parser.state = parser.prevState;
		}
	}
	update(parser, value){
		const currSet = parser.currStyleSet;
		if(currSet.size) currSet.size += ' ';
		if(!currSet.size) currSet.size = '';
		currSet.size += value;
		logger('update ImageSize to ', currSet.size)
	}
}


module.exports = backgroundParser;
