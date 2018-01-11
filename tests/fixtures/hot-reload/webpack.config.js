const webpack = require('webpack');
const plugin = require('../../../index.js').Plugin;
const extractTextWebpackPlugin = require('extract-text-webpack-plugin');
const commonExTract = new extractTextWebpackPlugin('css/common.css');

module.exports = {
    entry: {
        bundle: './index.js',
    },
    output: {
        path: __dirname + '/dest',
        filename: '[name].js',
        publicPath: '/',
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader', require.resolve('../../../index.js')],
            },
            { test: /\.png$/, use: ['file-loader', {
                loader: 'url-loader',
                options: {
                    limit: 1,
                },
            }] },
        ],
    },
    plugins: [
        new plugin(),
    ],
};
