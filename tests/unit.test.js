/**
 * test attribute function in plugin Object
 */
const shell = require('shelljs');
const path = require('path');
const Plugin = require('../src/Plugin.js');
const utils = require('../src/utils.js');
const IconFontPlugin = new Plugin();
const expect = require('chai').expect;

shell.rm('-rf', path.resolve(__dirname, './__test_tmp_*'));
IconFontPlugin.tmpPath = path.resolve(__dirname, './__test_tmp_' + Date.now());
shell.mkdir(IconFontPlugin.tmpPath);

describe('icon font plugin api test:', () => {
    it('#function resovle url test: ', (done) => {
        const urlList = [
            ['http://nos.163.com/cloud/public', '/font/icon-font.eot', 'http://nos.163.com/cloud/public/font/icon-font.eot'],
            ['http://nos.163.com/cloud/public', 'font/icon-font.eot', 'http://nos.163.com/cloud/public/font/icon-font.eot'],
            ['http://nos.163.com/cloud/public/', 'font/icon-font.eot', 'http://nos.163.com/cloud/public/font/icon-font.eot'],
            ['/public/', 'font/icon-font.eot', '/public/font/icon-font.eot'],
            ['/public/', '../font/icon-font.eot', '/font/icon-font.eot'],
            ['/public/', '/font/icon-font.eot', '/public/font/icon-font.eot'],
            ['/public', 'font/icon-font.eot', '/public/font/icon-font.eot'],
            ['/public', '/font/icon-font.eot', '/public/font/icon-font.eot'],
            ['public', 'font/icon-font.eot', 'public/font/icon-font.eot'],
            ['public', '/font/icon-font.eot', 'public/font/icon-font.eot'],
            ['public/', 'font/icon-font.eot', 'public/font/icon-font.eot'],
            ['public/', '/font/icon-font.eot', 'public/font/icon-font.eot'],
        ]
        urlList.forEach((urls) => {
            const resultEql = urls[2];
            const result = utils.urlResolve(urls[0], urls[1]);
            expect(result).to.eql(resultEql);
        }) 
        done();
    });
});
