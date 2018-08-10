const webpack = require('webpack');
const CSSSpritePlugin = require('../../../index.js').Plugin;

const postcssPlugins = [
    require('postcss-px-to-viewport')({
        viewportWidth: 750, // (Number) The width of the viewport
        // viewportHeight: 1334, // (Number) The height of the viewport.
        unitPrecision: 3, // (Number) The decimal numbers to allow the REM units to grow to.
        viewportUnit: 'vw', // (String) Expected units.
        selectorBlackList: ['.ignore', '.hairlines'], // (Array) The selectors to ignore and leave as px.
        minPixelValue: 1, // (Number) Set the minimum pixel value to replace.
        mediaQuery: false, // (Boolean) Allow px to be converted in media queries.
    }),
    require('postcss-viewport-units')({}),
];

module.exports = {
    entry: {
        bundle: './index.js',
    },
    output: {
        path: __dirname + '/dest',
        filename: '[name].js',
        publicPath: 'dest/',
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader', require.resolve('../../../index.js'), {
                    loader: 'postcss-loader',
                    options: { plugins: postcssPlugins },
                }],
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
        new CSSSpritePlugin({
            plugins: postcssPlugins,
        }),
    ],
};
