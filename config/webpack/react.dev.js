import webpack from 'webpack';
// const HtmlWebpackPlugin = require('html-webpack-plugin');
// const { spawn } = require('child_process');

import paths from './paths';
import path from 'path';

module.exports = ({target}) => {
    return ({
        mode: 'development',
        devtool: 'eval-source-map',

        target,

        // output: {
        //     // filename: '[name].js',
        //     // path: paths.outputPath,
        //     // chunkFilename: '[name].js'
        //     filename: ({chunk: {name}}, assetInfo) => {
        //         // console.log(name);
        //         return name === 'main' ? '[name].js' : `${paths.jsFolder}/[name].[fullhash].js`;
        //     },
        //     path: paths.outputPath,
        //     publicPath: '/',
        // },
        // output: {
        //     // globalObject: this,
        //     clean: true,
        //     filename: ({chunk: {name}}, assetInfo) => {
        //         // console.log(name);
        //         // return name === 'main' ? '[name].js' : `${paths.jsFolder}/[name].[fullhash].js`;
        //         return `${paths.jsFolder}/[name].[fullhash].js`;
        //     },
        //     path: paths.outputPath,
        //     publicPath: '.',
        //     // chunkFilename: '[name].[contenthash].js'
        // },
        output: {
            filename: `${paths.jsFolder}/[name].js`,
            path: path.resolve(paths.outputPath, 'renderer'),
            chunkFilename: '[name].js'
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
            client: {
                overlay: {
                    warnings: false,
                    errors: true
                },
                logging: 'verbose',
            },
            static: {
                directory: path.resolve(paths.outputPath, 'renderer'),
                publicPath: '/',
            },
            allowedHosts: 'all',
            compress: true,
            historyApiFallback: {
                rewrites: [
                    { from: /.*/, to: '/index.html' },
                ],
            },
            port: process.env.PORT || 8081,
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
            // setupMiddlewares: (middlewares, devServer) => {
            //     middlewares.push({
            //         name: 'electron',
            //         middleware: (req, res) => {
            //             console.log(`spawn electron on port ${port}`);
            //             spawn(
            //                 'npx',
            //                 ['electron', `.`],
            //                 { shell: true, env: process.env, stdio: 'inherit' }
            //             )
            //             .on('close', code => process.exit(0))
            //             .on('error', spawnError => console.error(spawnError));
            //         }
            //     });
            //     return middlewares;
            // },
        },
        watchOptions: {
            ignored: /node_modules/
        },
        plugins: [
            // new webpack.HotModuleReplacementPlugin({
            //     // multiStep: true,
            // }),
            // new webpack.SourceMapDevToolPlugin({}),
            // new HtmlWebpackPlugin({
            //     template: paths.templatePath,
            // }),
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify('development'),
                // 'process.env.PORT': JSON.stringify(process.env.PORT),
            })
        ],
    });
};
