const fs = require('fs');
const path = require('path');
const runWebpack = require('base-css-image-loader/test/fixtures/runWebpack');
const expect = require('chai').expect;
const { utils } = require('base-css-image-loader');

const caseName = 'extract-text-webpack-plugin';
const replaceReg = /REPLACE_BACKGROUND\([^)]*\)/g;

describe('Webpack Integration test', () => {
    it('#test extract-text-webpack-plugin config: ' + caseName, (done) => {
        runWebpack(caseName, { casesPath: path.resolve(__dirname, './cases') }, (err, data) => {
            if (err)
                return done(err);

            const files = fs.readdirSync(data.outputPath);
            expect(files).to.eql([
                'background_sprite.png',
                'background_sprite@2x.png',
                'bundle.js',
                'index.css',
                'test.png',
                'test@2x.png',
            ]);
            const filesContent = fs.readFileSync(path.resolve(data.outputPath, 'background_sprite.png'));
            const md5Code = utils.md5Create(filesContent);
            expect(md5Code).to.eql('96059fa5a49046b499352e23fea86070');
            const filesContent2 = fs.readFileSync(path.resolve(data.outputPath, 'test.png'));
            const md5Code2 = utils.md5Create(filesContent2);
            expect(md5Code2).to.eql('e1645b7464e7a59bbc9466b7f4f1562b');
            const filesContent3 = fs.readFileSync(path.resolve(data.outputPath, 'background_sprite@2x.png'));
            const md5Code3 = utils.md5Create(filesContent3);
            expect(md5Code3).to.eql('96059fa5a49046b499352e23fea86070');
            const filesContent4 = fs.readFileSync(path.resolve(data.outputPath, 'test@2x.png'));
            const md5Code4 = utils.md5Create(filesContent4);
            expect(md5Code4).to.eql('e1645b7464e7a59bbc9466b7f4f1562b');
            const cssContent = fs.readFileSync(path.resolve(data.outputPath, 'index.css')).toString();
            expect(replaceReg.test(cssContent)).to.eql(false);
            done();
        });
    });
});
