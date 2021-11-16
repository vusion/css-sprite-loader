"use strict";

var fs = require('fs');

var path = require('path');

var expect = require('chai').expect;

var _require = require('base-css-image-loader'),
    utils = _require.utils;

var shell = require('shelljs');

var execa = require('execa');

var caseName = 'default';
var replaceReg = /REPLACE_BACKGROUND\([^)]*\)/g;
describe('Webpack Integration test', function () {
  var buildCLI = path.resolve(__dirname, '../node_modules/.bin/webpack');
  var runDir = path.join('../test/cases/' + caseName);
  var destDir = path.join('./cases/' + caseName + '/dest');
  before(function () {
    shell.cd(path.resolve(__dirname, runDir));
  });
  afterEach(function () {
    shell.rm('-rf', path.resolve(__dirname, destDir));
  });
  it('#test default config: ' + caseName, function (done) {
    execa(buildCLI, ['--config', './webpack.config.js']).then(function (res) {
      var files = fs.readdirSync(path.resolve(__dirname, destDir));
      expect(files).to.eql(['background_sprite.png', 'bundle.js', 'test.png']);
      var filesContent = fs.readFileSync(path.resolve(__dirname, destDir + '/background_sprite.png'));
      var md5Code = utils.md5Create(filesContent);
      expect(md5Code).to.eql('d158e28d383a33dd07e4b50571556e5d');
      var filesContent2 = fs.readFileSync(path.resolve(__dirname, destDir + '/test.png'));
      var md5Code2 = utils.md5Create(filesContent2);
      expect(md5Code2).to.eql('4812de9d8e0456fd3f178dbef18513e7');
      var cssContent = fs.readFileSync(path.resolve(__dirname, destDir + '/bundle.js')).toString();
      expect(replaceReg.test(cssContent)).to.eql(false);
      done();
    });
  });
});