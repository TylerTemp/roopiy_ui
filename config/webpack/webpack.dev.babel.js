import webpack from 'webpack';
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { spawn } = require('child_process');

import paths from './paths';

module.exports = ({port=8004, api_port: apiPort=8003}) => ({
    mode: 'development',
    devtool: 'eval-source-map',

    target: 'electron-renderer',

    output: {
        // publicPath: '/',
        filename: '[name].js',
        path: paths.outputPath,
        chunkFilename: '[name].js'
        // path: paths.outputPath,
        // publicPath: '/',
        // filename: 'bundle.js',
    },
    performance: {
        hints: 'warning',
        maxAssetSize: 450000,
        maxEntrypointSize: 8500000,
        assetFilter: assetFilename => {
            return (
                assetFilename.endsWith('.css') || assetFilename.endsWith('.js')
            );
        }
    },
    optimization: {
        splitChunks: {
            chunks: 'all'
        }
    },
    devServer: {
        // client: {
        //     overlay: {
        //         warnings: false,
        //         errors: true
        //     },
        //     logging: 'verbose',
        // },
        // static: paths.outputPath,
        // allowedHosts: 'all',
        // compress: true,
        // historyApiFallback: {
        //     rewrites: [
        //         {from: /.*/, to: '/index.html'},
        //     ],
        // },
        // port,
        // proxy: {
        //     '/api': {
        //         target: `http://localhost:${apiPort}`,
        //         pathRewrite: {'^/api' : ''},
        //         proxyTimeout: 1000 * 60 * 60 * 2,
        //         timeout: 1000 * 60 * 60 * 2,
        //         onProxyReq: (proxyReq, req) => req.setTimeout(1000 * 60 * 60 * 2),
        //         secure: false,
        //     },
        // },

        static: paths.outputPath,
        // stats: {
        //   colors: true,
        //   chunks: false,
        //   children: false
        // },

        setupMiddlewares: (middlewares, devServer) => {
            // spawn(
            //     'npx',
            //     ['electron', '.'],
            //     { shell: true, env: process.env, stdio: 'inherit' }
            // )
            // .on('close', code => process.exit(code))
            // .on('error', spawnError => console.error(spawnError));
            middlewares.unshift({
                name: 'electron',
                middleware: (req, res) => {
                    spawn(
                        'npx',
                        ['electron', '.'],
                        { shell: true, env: process.env, stdio: 'inherit' }
                    )
                    .on('close', code => process.exit(0))
                    .on('error', spawnError => console.error(spawnError));
                }
            });
            return middlewares;
        },
    },
    watchOptions: {
        ignored: /node_modules/
    },
    plugins: [
        // new webpack.HotModuleReplacementPlugin({
        //     // multiStep: true,
        // }),
        // new webpack.SourceMapDevToolPlugin({}),
        new HtmlWebpackPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development')
        })
    ],
});
