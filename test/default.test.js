const fs = require('fs');
const path = require('path');
const runWebpack = require('base-css-image-loader/test/fixtures/runWebpack');
const expect = require('chai').expect;
const { utils } = require('base-css-image-loader');

const caseName = 'default';
const replaceReg = /REPLACE_BACKGROUND\([^)]*\)/g;

describe('Webpack Integration test', () => {
    it('#test default config: ' + caseName, (done) => {
        runWebpack(caseName, { casesPath: path.resolve(__dirname, './cases') }, (err, data) => {
            if (err)
                return done(err);

            const filesContent = fs.readFileSync(path.resolve(data.outputPath, 'sprite.png'));
            const md5Code = utils.genMD5(filesContent);
            expect(md5Code).to.eql('d8defd30309a90e991feff6014911569');
            const filesContent2 = fs.readFileSync(path.resolve(data.outputPath, 'sprite-nav.png'));
            const md5Code2 = utils.genMD5(filesContent2);
            expect(md5Code2).to.eql('8c44ae541ba21ba1c42011335f3b0801');
            const cssContent = fs.readFileSync(path.resolve(data.outputPath, 'bundle.js')).toString();
            expect(replaceReg.test(cssContent)).to.eql(false);
            done();
        });
    });
});
