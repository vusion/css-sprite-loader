'use strict';

const crypto = require('crypto');
const url = require('url');
const path = require('path');
const log = true;
module.exports = {
    md5Create(stream) {
        const md5 = crypto.createHash('md5');
        md5.update(stream);
        return md5.digest('hex');
    },
    createFontFace(font) {
        let srcStr = [];
        const svgHash = font.svg.hash;

        for (const type in font) {
            const url = font[type].url;
            // const hash = font[type].hash;
            if (font.hasOwnProperty(type)) {
                switch (type) {
                    case 'eot':
                        srcStr.push('url("' + url + '?' + svgHash + '#iefix") format("embedded-opentype")');
                        break;
                    case 'woff':
                        srcStr.push('url("' + url + '?' + svgHash + '") format("woff")');
                        break;
                    case 'ttf':
                        srcStr.push('url("' + url + '?' + svgHash + '") format("truetype")');
                        break;
                    case 'svg':
                        srcStr.push('url("' + url + '?' + svgHash + '#' + font.name + '") format("svg")');
                        break;
                    default:
                        break;
                }
            }
        }
        srcStr = srcStr.join(',\n\t');
        return `@font-face {\n\tfont-family: "${font.name}";\n\tsrc:${srcStr};\n}`;
    },
    urlResolve(base, urlPath) {
        if (path.sep === '\\')
            urlPath = urlPath.replace(/\\/g, '/');
        if (urlPath[0] !== '/')
            urlPath = '/' + urlPath;
        if (base[base.length - 1] !== '/')
            base = base + '/';
        return url.resolve(base, '.' + urlPath);
    },
    logger(title) {
        if(!log) return ;
        console.log(`-----------------${title}-----------------`);
        Array.prototype.slice.call(arguments).slice(1).forEach((ct) => {
            console.log(ct);
        })
        console.log('-----------------------------------------');
    },
    unit2Number(s){
        const t = /([^a-zA-Z]+)[a-zA-Z]+/.exec(s)
        if(t) return Number(t[1]);
        return s;
    }, 
    str2NumArray(str, w, h){
        const strArr = str.split(' ');

        const ww = /([^a-zA-Z]+)[a-zA-Z]+/.exec(w)
        if(ww) w = Number(ww[1]);

        const hh = /([^a-zA-Z]+)[a-zA-Z]+/.exec(h)
        if(hh) h = Number(hh[1]);

        let rslt = strArr.map((s, i) => {
            const p = /([^$]+)%/.exec(s);
            if(p) return Number(p[1])/100 * (i===0?w:h);

            const t = /([^a-zA-Z]+)[a-zA-Z]+/.exec(s)
            if(t) return Number(t[1]);

            return Number(s);
        });
        if(rslt.length === 1) rslt = Array(2).fill(rslt[0])
        return rslt;
    }
};













