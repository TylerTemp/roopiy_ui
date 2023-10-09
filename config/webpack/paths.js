// import path from 'path';

const path = require('path');

module.exports = {
    root: path.resolve(__dirname, '../', '../').replace('\\', '/'),
    outputPath: path.resolve(__dirname, '../', '../', 'build/renderer'),
    entryPath: path.resolve(__dirname, '../', '../', 'src/Renderer/index.tsx'),
    templatePath: path.resolve(__dirname, '../', '../', 'src/Renderer/index.html').replace('\\', '/'),
    imagesFolder: 'images',
    fontsFolder: 'fonts',
    cssFolder: 'css',
    jsFolder: 'js'
};
