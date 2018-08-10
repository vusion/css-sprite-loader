const CssSpritePlugin = require('../../../index').Plugin;

module.exports = {
    entry: {
        bundle: './index.js',
    },
    output: {
        path: __dirname + '/dest',
        publicPath: 'dest/',
        filename: '[name].js',
    },
    module: {
        rules: [
            { test: /\.png$/, use: ['file-loader'] },
            { test: /\.css$/, use: ['style-loader', 'css-loader', require.resolve('../../../index')] },
        ],
    },
    plugins: [new CssSpritePlugin()],
};
