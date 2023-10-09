// import path from 'path';

const path = require('path');

module.exports = {
    root: path.resolve(__dirname, '../', '../').replace('\\', '/'),
    outputPath: path.resolve(__dirname, '../', '../', 'build'),
    electronMainPath: path.resolve(__dirname, '../', '../', 'src/main.ts').replace('\\', '/'),
    entryPath: path.resolve(__dirname, '../', '../', 'src/index.tsx'),
    templatePath: path.resolve(__dirname, '../', '../', 'src/index.html').replace('\\', '/'),
    imagesFolder: 'images',
    fontsFolder: 'fonts',
    cssFolder: 'css',
    jsFolder: 'js'
};
