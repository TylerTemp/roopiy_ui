/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import { net } from 'electron';
import Os from 'os'
import fs from "fs";
import mime from "mime";
import { ProjectsRoot } from './Utils/Config';

export function resolveHtmlPath(htmlFileName: string) {
    if (process.env.NODE_ENV === 'development') {
        const port = process.env.PORT || 1212;
        const url = new URL(`http://localhost:${port}`);
        url.pathname = htmlFileName;
        return url.href;
    }
    return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

export const GetProjectResource = (request: Request): Promise<Response> => {
    let uri = request.url.slice('project://'.length);
    if(uri.indexOf('?') !== -1) {
        uri = uri.slice(0, uri.indexOf('?'));
    }

    let filePath = path.join(ProjectsRoot, uri);

    // return fs.promises.readFile(filePath)
    //     .then(buffer => {
    //         const mimeType = mime.getType(filePath)!;
    //         console.log(`read file ${filePath}: ${mimeType} data.length=${buffer.length}`);
    //         return new Response(buffer, {
    //             headers: {
    //                 'content-type': mimeType,
    //                 'content-length': buffer.length.toString(),
    //             }
    //         });
    //     });

    // return new Promise((resolve, reject) => {
    //     fs.readFile(filePath, (err, data) => {
    //         if(err) {
    //             // console.error(err);
    //             // throw err;
    //             reject(err);
    //         }
    //         console.log(`read file ${filePath}: data.length=${data.length}`);
    //         // console.log(data);
    //         // return new Response(data);
    //         resolve(new Response(data));
    //     });
    // });


    console.log(`filePath=${filePath}`);

    if(Os.platform() === 'win32') {
        const [disk, ...leftPaths] = filePath.split('\\');
        filePath = `/${disk}/${leftPaths.join('/')}`
    }

    console.log(`fetch file file://${filePath}`);

    return net.fetch(`file://${filePath}`)
        .then(resp => {
            console.log(resp);
            return resp;
        })
        .catch(err => {
            console.error(err);
            throw err;
        });
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
