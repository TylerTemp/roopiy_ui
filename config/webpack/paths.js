import path from 'path';

module.exports = {
    root: path.resolve(__dirname, '../', '../').replace('\\', '/'),
    outputPath: path.resolve(__dirname, '../', '../', 'build').replace('\\', '/'),
    // entryPath: path.resolve(__dirname, '../', '../', 'src/main.tsx').replace('\\', '/'),
    entryPath: path.resolve(__dirname, '../', '../', 'src/index.tsx').replace('\\', '/'),
    templatePath: path.resolve(__dirname, '../', '../', 'src/index.html').replace('\\', '/'),
    imagesFolder: 'images',
    fontsFolder: 'fonts',
    cssFolder: 'css',
    jsFolder: 'js'
};
