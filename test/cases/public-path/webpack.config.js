const CSSSpritePlugin = require('../../../index').Plugin;

module.exports = {
    entry: {
        bundle: './index.js',
    },
    output: {
        path: __dirname + '/dest',
        filename: '[name].js',
        publicPath: '/some/public/',
    },
    module: {
        rules: [
            { test: /\.css$/, use: ['style-loader', 'css-loader', require.resolve('../../../index')] },
            { test: /\.png$/, use: ['file-loader'] },
        ],
    },
    plugins: [new CSSSpritePlugin({
        output: 'static',
        publicPath: 'http://cdn.163.com/cdn/static',
    })],
};
