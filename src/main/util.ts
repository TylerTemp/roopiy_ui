/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import { join, resolve } from 'path';
import { net } from 'electron';
import Os from 'os'
import { ProjectsRoot } from './Utils/Config';

export function resolveHtmlPath(htmlFileName: string) {
    if (process.env.NODE_ENV === 'development') {
        const port = process.env.PORT || 1212;
        const url = new URL(`http://localhost:${port}`);
        url.pathname = htmlFileName;
        return url.href;
    }
    return `file://${resolve(__dirname, '../renderer/', htmlFileName)}`;
}

export const GetProjectResource = (request: Request): Promise<Response> => {
    let uri = request.url.slice('project://'.length);
    if(uri.indexOf('?') !== -1) {
        uri = uri.slice(0, uri.indexOf('?'));
    }

    let filePath = join(ProjectsRoot, uri);

    console.log(`filePath=${filePath}`);

    if(Os.platform() === 'win32') {
        const [disk, ...leftPaths] = filePath.split('\\');
        filePath = `/${disk}/${leftPaths.join('/')}`
    }

    console.log(`fetch file file://${filePath}`);

    return net.fetch(`file://${filePath}`);
}


export const GetExtResource = ({url}: Request): Promise<Response> => {

    let uri = url.slice('extfile://'.length);
    if(Os.platform() === 'win32') {
        const [disk, ...leftPaths] = uri.split('/');
        uri = `/${disk}:/${leftPaths.join('/')}`
    }

    console.log(`uri`, uri);

    const protocalUri = `file://${uri}`;

    console.log(`fetch file`, protocalUri);

    return net.fetch(protocalUri);
}
