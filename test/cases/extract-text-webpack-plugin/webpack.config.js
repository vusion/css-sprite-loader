const CSSSpritePlugin = require('../../../index').Plugin;
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: {
        bundle: './index.js',
    },
    output: {
        path: __dirname + '/dest',
        filename: '[name].js',
    },
    module: {
        rules: [
            { test: /\.css$/, use: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: ['css-loader', require.resolve('../../../index')],
            }) },
            { test: /\.png$/, use: ['file-loader'] },
        ],
    },
    plugins: [
        new CSSSpritePlugin(),
        new ExtractTextPlugin('bundle.css'),
    ],
};
