const path = require('path');
const runWebpack = require('base-css-image-loader/test/fixtures/runWebpack');

const cases = ['background', 'image-set', 'postcss-plugins', 'public-path', 'smart'];

describe('Webpack Integration Tests', () => {
    cases.forEach((caseName) => {
        it('#test webpack integration case: ' + caseName, (done) => {
            runWebpack(caseName, { casesPath: path.resolve(__dirname, './cases') }, done);
        });
    });
});
