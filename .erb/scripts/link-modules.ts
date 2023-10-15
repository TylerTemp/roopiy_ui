import fs from 'fs';
import webpackPaths from '../configs/webpack.paths';

const { srcNodeModulesPath } = webpackPaths;
const { appNodeModulesPath } = webpackPaths;

if (!fs.existsSync(srcNodeModulesPath) && fs.existsSync(appNodeModulesPath)) {
    console.log(`link ${srcNodeModulesPath} to ${appNodeModulesPath}`);
    fs.symlinkSync(appNodeModulesPath, srcNodeModulesPath, 'junction');
    console.assert(fs.existsSync(srcNodeModulesPath), `link ${srcNodeModulesPath} to ${appNodeModulesPath} failed`);
    console.log(`link complete`);
}
