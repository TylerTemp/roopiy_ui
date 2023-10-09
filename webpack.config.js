require('@babel/register');
const { merge } = require('webpack-merge');

const common = require('./config/webpack/webpack.common.babel');

const envs = {
    development: 'dev',
    production: 'prod'
};

/* eslint-disable global-require,import/no-dynamic-require */
const envName = envs[process.env.NODE_ENV || 'development'];
const envConfig = require(`./config/webpack/webpack.${envName}.babel`);

module.exports = (env={}) => {
    console.log(env);
    return merge(common(env), envConfig(env));
};
