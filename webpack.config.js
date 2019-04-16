const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const fs   = require('fs');

var config = {
    entry: './site/public/ts/Main.ts',
    output: {
        filename: 'Bundle.js',
        path: path.resolve(__dirname, 'build')
    },
    plugins: [
        new CopyWebpackPlugin([
            { from: 'site/public/index.php', to: 'index.php' },
            { from: 'site/app/',  to: 'app/' },
            { from: 'site/data/', to: 'data/' },
            { from: 'site/public/css/', to: 'css/' },
            { from: 'site/public/img/', to: 'img/' }
        ])
    ],
    devtool: 'source-map',
    module: {
        rules: [ {
            test: /\.tsx?$/,
            exclude: /(node_modules)/,
            use: {
                loader: 'ts-loader'
            }
        } ]
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ]
    }
};

module.exports = (env, argv) => {

    if (argv.mode === 'development') {
        // do some different stuff maybe
    }

    return config;
};
