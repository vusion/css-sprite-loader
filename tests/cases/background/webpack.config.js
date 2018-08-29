const CSSSpritePlugin = require('../../../index').Plugin;

module.exports = {
    entry: {
        bundle: './index.js',
    },
    output: {
        path: __dirname + '/',
        filename: '[name].js',
        publicPath: '/',
    },
    module: {
        rules: [
            { test: /\.css$/, use: ['style-loader', 'css-loader', require.resolve('../../../index')] },
            { test: /\.png$/, use: ['file-loader'] },
        ],
    },
    plugins: [new CSSSpritePlugin()],
};
