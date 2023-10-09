// import * as path from "path";
const path = require('path');
// import { DefinePlugin } from "webpack";
const { DefinePlugin } = require('webpack');

const rootPath = path.resolve(__dirname, "..", "..");

// interface Params {
//   [key:string]: string | undefined
// }

// export default ({port: portStrOrUndefined=''}) => {
module.exports = ({port: portStrOrUndefined=''}) => {

  let port;
  if (process.env.PORT === undefined) {
      port = portStrOrUndefined === '' ? 8081 : parseInt(portStrOrUndefined, 10);
  }
  else {
      port = process.env.PORT;
  }

  console.log(`electron`, process.env.PORT, portStrOrUndefined, port);

  return ({
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    devtool: "source-map",
    entry: path.resolve(rootPath, "src", "Main", "main.ts"),
    target: "electron-main",
    module: {
      rules: [
        {
          test: /\.(js|ts|tsx)$/,
          exclude: /node_modules/,
          include: /src/,
          use: {
            loader: "ts-loader",
          },
        },
      ],
    },
    node: {
      __dirname: false,
    },
    output: {
      path: path.resolve(rootPath, "build", "electron"),
      filename: "[name].js",
    },
    plugins: [
      new DefinePlugin({
        // 'process.env.NODE_ENV': JSON.stringify('development'),
        'process.env.PORT': JSON.stringify(port),
      })
    ],
  });
};

// export default config;
