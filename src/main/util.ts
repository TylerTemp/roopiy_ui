/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import { join, resolve } from 'path';
import { ProjectsRoot } from './Utils/Config';
import { net } from 'electron';

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
    const uri = request.url.slice('project://'.length);

    const filePath = join(ProjectsRoot, uri);

    return net.fetch(`file://${filePath}`);
}
