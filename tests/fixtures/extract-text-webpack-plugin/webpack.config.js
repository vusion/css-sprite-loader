const IconFontPlugin = require('../../../index').Plugin;
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');


module.exports = {
    entry: {
        bundle: './index.js',
    },
    output: {
        path: __dirname + '/dest',
        filename: '[name].js',
        publicPath:"/"
    },
    module: {
        rules: [{ 
            test: /\.css$/, 
            use: ExtractTextPlugin.extract({
                fallback: "style-loader",
                use: ["css-loader", require.resolve('../../../index')],
            })
        }]
    },
    plugins: [new IconFontPlugin(), new ExtractTextPlugin('index.css')],
};
