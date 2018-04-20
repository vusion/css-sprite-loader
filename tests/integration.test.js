const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

const testCase = ['retina', 'default'];

describe('Webpack Integration Tests', () => {
    testCase.forEach((value) => {
        it('#test webpack integration case: ' + value, (done) => {
            const configPath = path.join('../tests/fixtures/', value, '/webpack.config.js');
            const outputDirectory = path.join('/fixtures/', value, '/dest');
            const options = require(configPath);
            for (const chunk of Object.keys(options.entry))
                options.entry[chunk] = path.join(__dirname, '/fixtures/', value, options.entry[chunk]);

            webpack(options, (err, stats) => {
                if (err)
                    return done(err);
                if (stats.hasErrors())
                    return done(new Error(stats.toString()));
                // todo checkout result file context
                done();
            });
        });
    });
});
