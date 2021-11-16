const fs = require('fs');
const path = require('path');
const runWebpack = require('base-css-image-loader/test/fixtures/runWebpack');
const expect = require('chai').expect;
const { utils } = require('base-css-image-loader');

const caseName = 'retina';
const replaceReg = /REPLACE_BACKGROUND\([^)]*\)/g;

describe('Webpack Integration test', () => {
    it('#test retina config: ' + caseName, (done) => {
        runWebpack(caseName, { casesPath: path.resolve(__dirname, './cases') }, (err, data) => {
            if (err)
                return done(err);

            const filesContent = fs.readFileSync(path.resolve(data.outputPath, 'sprite.png'));
            const md5Code = utils.genMD5(filesContent);
            expect(md5Code).to.eql('873103c642eaf6ee9d736d4703f2201d');
            const filesContent2 = fs.readFileSync(path.resolve(data.outputPath, 'sprite@2x.png'));
            const md5Code2 = utils.genMD5(filesContent2);
            expect(md5Code2).to.eql('51d951f98092152d8fc56bf3380577e3');
            const filesContent3 = fs.readFileSync(path.resolve(data.outputPath, 'sprite@3x.png'));
            const md5Code3 = utils.genMD5(filesContent3);
            expect(md5Code3).to.eql('62594d2f59ff829b82c49e9d717d7759');
            const filesContent4 = fs.readFileSync(path.resolve(data.outputPath, 'sprite@4x.png'));
            const md5Code4 = utils.genMD5(filesContent4);
            expect(md5Code4).to.eql('4a6a7dbace7933efe321b357d4db2fb9');
            const cssContent = fs.readFileSync(path.resolve(data.outputPath, 'bundle.js')).toString();
            expect(replaceReg.test(cssContent)).to.eql(false);
            done();
        });
    });
});
