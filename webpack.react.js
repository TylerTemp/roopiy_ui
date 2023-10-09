require('@babel/register');
const { merge } = require('webpack-merge');

const common = require('./config/webpack/webpack.common.babel');

const envs = {
    development: 'dev',
    production: 'prod'
};

/* eslint-disable global-require,import/no-dynamic-require */
const envName = envs[process.env.NODE_ENV || 'development'];
const flavor = process.env.FLAVOR;

const envConfig = require(`./config/webpack/react.${envName}`);

module.exports = (env={}) => {
    const target = flavor === 'electron'? 'electron-renderer': undefined;
    console.log(`${target}.${envName}`, env);
    return merge(common(env), envConfig({...env, target}));
};
