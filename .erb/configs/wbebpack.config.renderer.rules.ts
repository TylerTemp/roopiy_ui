const sass = require('sass');

export default [
    {
        test: /\.css/,
        exclude: /node_modules/,
        use: [
            { loader: 'style-loader' },
            {
                loader: 'css-loader',
                options: {
                    modules: {
                        localIdentName:'[name]__[local]--[hash:base64:5]',
                    },
                    sourceMap: true,
                },
            },
        ],
    },
    {
        test: /\.css/,
        include: /node_modules/,
        use: [
            { loader: 'style-loader' },
            {
                loader: 'css-loader',
            },
        ],
    },
    {
        test: /\.scss$/,
        use: [
            'style-loader',
            {
                loader: 'css-loader',
                options: {
                    modules: {
                        localIdentName:'[name]__[local]--[hash:base64:5]',
                    },
                    sourceMap: true,
                    esModule: true,
                },
            },
            // 'postcss-loader',
            {
                loader: 'sass-loader',
                options: {
                    implementation: sass,
                },
            },
        ],
    },
    {
        test: /\.less$/,
        include: /node_modules/,
        use: [
            {
                loader: 'style-loader',
            },
            {
                loader: 'css-loader', // translates CSS into CommonJS
            },
            {
                loader: 'less-loader', // compiles Less to CSS
                options: {
                    modifyVars: {
                        // 'primary-color': '#1DA57A',
                        // 'link-color': '#1DA57A',
                        // 'border-radius-base': '2px',
                        // or
                        // 'hack': `true; @import "your-less-file-path.less";`, // Override with less file
                    },
                    javascriptEnabled: true,
                },
            },
        ],
    },
    {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        exclude: /node_modules/,
        loader: 'file-loader'
    },
    {
        test: /\.(woff|woff2)$/,
        exclude: /node_modules/,
        use: [
            {
                loader: 'url-loader',
                options: {
                    prefix: 'font',
                    limit: 5000,
                }
            },
        ],
    },
    {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        exclude: /node_modules/,
        use: [
            {
                loader: 'url-loader',
                options: {
                    mimetype: 'application/octet-stream',
                    limit: 10000,
                },
            },
        ],
    },
    {
        test: /\.(jpe?g|png|gif|svg)$/i,
        use: [
            {
                loader: 'url-loader',
                options: {
                    limit: 10000,
                },
            },
            {
                loader: 'img-loader',
            },
        ],
    }
];
