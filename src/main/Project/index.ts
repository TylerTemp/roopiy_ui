import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, type Dirent } from 'fs';
import { spawnSync } from 'child_process';
import { join } from 'path';
import type ProjectType from '~s/Types/Project';
import type ApiPrepareProject from '~m/Project/ApiPrepareProject';
import WebSocket from 'ws';
import Face from '~s/Types/Face';
import {ProjectsRoot, WrapperHost} from '../Utils/Config';


export const GetList = (): string[] => {
    const result = readdirSync(ProjectsRoot, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && existsSync(join(ProjectsRoot, dirent.name, 'config.json')))
        .map(dirent => dirent.name);

    console.log(`project list:`, result);
    return result;
};


export const GetConfig = (projectFolder: string): ProjectType => {
    const filePath = join(ProjectsRoot, projectFolder, 'config.json');
    console.log(`reading config`, filePath);
    const fileData = readFileSync(filePath);
    const result: ProjectType = JSON.parse(fileData.toString());
    console.log(`read config`, filePath, result);
    return result;
}

export const GetVideoSeconds = (videoFile: string): number => {
    const args: string[] = ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=duration', '-of',
        'json=compact=1', videoFile];

    console.log(`ffprobe ${  args.join(' ')}`);
    const result = spawnSync('ffprobe', args, { encoding: 'utf-8', shell: false, stdio: 'pipe' });
    // console.assert(!result.stderr, result.stderr );
    console.log(result.status);
    console.log(result.stderr);
    console.log(`ffprobe output`, result.stdout);
    const outputAsJSON = JSON.parse(result.stdout);
    const durationStr = outputAsJSON.streams[0].duration;
    const duration: number = parseFloat(durationStr);
    console.assert(!isNaN(duration), `duration is NaN: ${durationStr}`);
    return duration;
}


export const ExtractVideo = (projectFolder: string, config: ProjectType, callback: (count:number) => void): Promise<void> => {
    const fileDir = join(ProjectsRoot, projectFolder);
    if(!existsSync(fileDir)) {
        console.log(`create dir ${fileDir}`);
        mkdirSync(fileDir, { recursive: true});
    }

    const apiPrepareProjeec: ApiPrepareProject = {
        Path: fileDir,
        Project: config,
    }

    console.log(`connect to wrapper`);

    const ws = new WebSocket(`ws://${WrapperHost}/extract_video`);
    ws.onopen = () => {
        console.log('connected');
        ws.send(JSON.stringify(apiPrepareProjeec));
    };

    return new Promise((resolve, reject) => {
        ws.onmessage = ({data}) => {
            // console.log(`message: ${data}`);
            if(data === 'end') {
                console.log(`extract finished`);
                resolve();
                ws.close();
                return;
            }

            callback(parseInt(data as string, 10));
        }

        ws.onerror = reject;
    });

    // return fetch(`ws://${WrapperHost}/extract_video`, {
    //     method: 'POST',
    //     body: JSON.stringify(apiPrepareProjeec),
    //     headers: {
    //         'Content-Type': 'application/json',
    //     }
    // })
    //     .then(resp => resp.text())
    //     .then(resp => {
    //         console.log(resp);
    //     });
}


export const ExtractFacesInProject = (projectFolder: string, callback: (curCount: number, totalCount: number, faceCount: number, name: string) => void): Promise<void> => {
    const rootPath: string = join(ProjectsRoot, projectFolder, 'frames');
    const images = readdirSync(rootPath, { withFileTypes: true })
        .filter(dirent => !dirent.isDirectory() && dirent.name.endsWith('.png'));

    return new Promise<void>(async (resolve, reject) => {
        for (let index = 0; index < images.length; index++) {
            const imageFile: Dirent = images[index];
            const url = `http://${WrapperHost}/identify_faces?file=${encodeURIComponent(join(rootPath, imageFile.name))}`;
            let respText;
            try {
                respText = await fetch(url).then(resp => resp.text());
            }
            catch (e) {
                reject(e);
                return;
            }
            let faces: Face[];

            try {
                faces = JSON.parse(respText) as Face[];
            }
            catch (e) {
                console.error(`error parsing json: ${respText}`);
                reject(e);
                return;
            }

            const filePath = join(rootPath, `${imageFile.name  }.json`);
            console.log(`writing config to ${filePath}`);
            writeFileSync(filePath, respText);

            callback(index+1, images.length, faces.length, imageFile.name);
        }
        resolve();
    });
}


export const SaveConfig = (projectFolder: string, config: ProjectType): void => {
    const fileDir = join(ProjectsRoot, projectFolder);
    if(!existsSync(fileDir)) {
        console.log(`create dir ${fileDir}`);
        mkdirSync(fileDir, { recursive: true});
    }

    const filePath = join(fileDir, 'config.json');
    const fileData = JSON.stringify(config, null, 4);
    console.log(`writing config to ${filePath}`, config);
    // console.log(fileData);
    writeFileSync(filePath, fileData);
}
