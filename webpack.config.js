/* eslint-disable */

const path = require('path');

module.exports = {
    entry: './index.ts',
    mode: 'production',
    target: 'node',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },//https://github.com/webpack/webpack/issues/5703#issuecomment-357512412
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            // from https://github.com/NodeRedis/node_redis/issues/790
            'hiredis': path.join(__dirname, 'hack/hiredis.js')
        }
    },
    output: {
        filename: './bundle.js',
        path: path.resolve(__dirname)
    }
};