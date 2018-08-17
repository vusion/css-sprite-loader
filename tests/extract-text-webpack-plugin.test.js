const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;
const utils = require('../src/utils');
const shell = require('shelljs');
const execa = require('execa');

const value = 'extract-text-webpack-plugin';
const replaceReg = /REPLACE_BACKGROUND\([^)]*\)/g;

describe('Webpack Integration Tests', () => {
    const buildCLI = path.resolve(__dirname, '../node_modules/.bin/webpack');
    const runDir = path.join('../tests/fixtures/' + value);
    const outputDirectory = path.join('./fixtures/' + value + '/dest');
    before(() => {
        shell.cd(path.resolve(__dirname, runDir));
    });
    afterEach(() => {
        shell.rm('-rf', path.resolve(__dirname, outputDirectory));
    });

    it('#test extract-text-webpack-plugin config: ' + value, (done) => {
        execa(buildCLI, ['--config', './webpack.config.js']).then((res) => {
            const files = fs.readdirSync(path.resolve(__dirname, outputDirectory));
            expect(files).to.eql([
                'background_sprite.png',
                'background_sprite@2x.png',
                'bundle.js',
                'index.css',
                'test.png',
                'test@2x.png',
            ]);
            const filesContent = fs.readFileSync(path.resolve(__dirname, outputDirectory + '/background_sprite.png'));
            const md5Code = utils.md5Create(filesContent);
            expect(md5Code).to.eql('96059fa5a49046b499352e23fea86070');
            const filesContent2 = fs.readFileSync(path.resolve(__dirname, outputDirectory + '/test.png'));
            const md5Code2 = utils.md5Create(filesContent2);
            expect(md5Code2).to.eql('e1645b7464e7a59bbc9466b7f4f1562b');
            const filesContent3 = fs.readFileSync(path.resolve(__dirname, outputDirectory + '/background_sprite@2x.png'));
            const md5Code3 = utils.md5Create(filesContent);
            expect(md5Code3).to.eql('96059fa5a49046b499352e23fea86070');
            const filesContent4 = fs.readFileSync(path.resolve(__dirname, outputDirectory + '/test@2x.png'));
            const md5Code4 = utils.md5Create(filesContent2);
            expect(md5Code4).to.eql('e1645b7464e7a59bbc9466b7f4f1562b');
            const cssContent = fs.readFileSync(path.resolve(__dirname, outputDirectory + '/index.css')).toString();
            expect(replaceReg.test(cssContent)).to.eql(false);
            done();
        });
    });
});
