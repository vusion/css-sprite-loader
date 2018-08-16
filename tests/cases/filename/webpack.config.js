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
        rules: [{ test: /\.css$/, use: ['style-loader', 'css-loader', require.resolve('../../../index')] }],
    },
    plugins: [new CssSpritePlugin({
        filename: '[name]_[hash].[ext]?[hash]',
    })],
};
