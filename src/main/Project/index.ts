import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import ProjectType from '~s/Types/Project';
import {ProjectsRoot, WrapperUrl} from '../Utils/Config';


export const GetList = (): string[] => {
    const result = readdirSync(ProjectsRoot, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    console.log(`project list:`, result);
    return result;
};


export const GetConfig = (projectFolder: string): ProjectType => {
    const filePath = join(ProjectsRoot, projectFolder, 'config.json');
    const fileData = readFileSync(filePath);
    const result: ProjectType = JSON.parse(fileData.toString());
    console.log(filePath, result);
    return result;
}


interface ApiPrepareProject {
    Path: string,
    Project: ProjectType,
}


export const CreateConfig = async (projectFolder: string, config: ProjectType): Promise<void> => {
    const fileDir = join(ProjectsRoot, projectFolder);
    if(!existsSync(fileDir)) {
        console.log(`create dir ${fileDir}`);
        mkdirSync(fileDir, { recursive: true});
    }

    const apiPrepareProjeec: ApiPrepareProject = {
        Path: fileDir,
        Project: config,
    }

    const resp = await fetch(WrapperUrl + `/extract_video`, {
        method: 'POST',
        body: JSON.stringify(apiPrepareProjeec),
        headers: {
            'Content-Type': 'application/json',
        }
    });
    const resp_1 = await resp.text();
    console.log(resp_1);
    const filePath = join(fileDir, 'config.json');
    const fileData = JSON.stringify(config, null, 4);
    console.log(`writing config to ${filePath}`);
    console.log(fileData);
    writeFileSync(filePath, fileData);
}
