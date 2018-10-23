const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;
const utils = require('../src/utils');
const shell = require('shelljs');
const execa = require('execa');

const value = 'default';
const replaceReg = /REPLACE_BACKGROUND\([^)]*\)/g;

describe('Webpack Integration test', () => {
    const buildCLI = path.resolve(__dirname, '../node_modules/.bin/webpack');
    const runDir = path.join('../test/fixtures/' + value);
    const outputDirectory = path.join('./fixtures/' + value + '/dest');
    before(() => {
        shell.cd(path.resolve(__dirname, runDir));
    });
    afterEach(() => {
        shell.rm('-rf', path.resolve(__dirname, outputDirectory));
    });

    it('#test default config: ' + value, (done) => {
        execa(buildCLI, ['--config', './webpack.config.js']).then((res) => {
            const files = fs.readdirSync(path.resolve(__dirname, outputDirectory));
            expect(files).to.eql([
                'background_sprite.png',
                'bundle.js',
                'test.png',
            ]);
            const filesContent = fs.readFileSync(path.resolve(__dirname, outputDirectory + '/background_sprite.png'));
            const md5Code = utils.md5Create(filesContent);
            expect(md5Code).to.eql('d158e28d383a33dd07e4b50571556e5d');
            const filesContent2 = fs.readFileSync(path.resolve(__dirname, outputDirectory + '/test.png'));
            const md5Code2 = utils.md5Create(filesContent2);
            expect(md5Code2).to.eql('4812de9d8e0456fd3f178dbef18513e7');
            const cssContent = fs.readFileSync(path.resolve(__dirname, outputDirectory + '/bundle.js')).toString();
            expect(replaceReg.test(cssContent)).to.eql(false);
            done();
        });
    });
});
