import { readdirSync, existsSync, mkdirSync, type Dirent } from 'fs';
import { spawnSync } from 'child_process';
import { join } from 'path';
import type ProjectType from '~s/Types/Project';
import type ApiPrepareProject from '~m/Project/ApiPrepareProject';
import WebSocket from 'ws';
// import { type FrameFaces } from '~s/Types/Edit';
import ImageSize from 'image-size';
import {ProjectsRoot, WrapperHost} from '../Utils/Config';
import { IdentifyFaces } from '../Utils/Face';
import Database, { Close, type FrameType, type FrameFaceType } from '../Utils/Database';


export const GetList = (): string[] => {
    const result = readdirSync(ProjectsRoot, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && existsSync(join(ProjectsRoot, dirent.name, 'config.db')))
        .map(dirent => dirent.name);

    console.log(`project list:`, result);
    return result;
};


export const GetConfig = (projectFolder: string): ProjectType => {
    const filePath = join(ProjectsRoot, projectFolder, 'config.db');
    console.log(`reading config`, filePath);
    const db = Database(filePath, true);
    const results = db.prepare('SELECT * FROM config').all() as {key: keyof ProjectType, value: string}[];
    const projectAcc: Partial<ProjectType> = {};
    results.forEach(({key, value: jsonStr}) => {
        projectAcc[key] = JSON.parse(jsonStr);
    });

    const project: ProjectType = projectAcc as ProjectType;

    console.log(`read config`, filePath, project);
    return project;
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
    console.assert(!Number.isNaN(duration), `duration is NaN: ${durationStr}`);
    return duration;
}


export const ExtractVideo = (projectFolder: string, config: ProjectType, callback: (count:number) => void): Promise<void> => {
    const _db = Database(join(ProjectsRoot, projectFolder, 'config.db'), false);
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


export const ExtractFacesInProject = async (projectFolder: string, callback: (curCount: number, totalCount: number, faceCount: number, name: string) => void): Promise<void> => {
    const rootPath: string = join(ProjectsRoot, projectFolder, 'frames');
    const images = readdirSync(rootPath, { withFileTypes: true })
        .filter(dirent => !dirent.isDirectory() && dirent.name.endsWith('.png'));

    const db = Database(join(ProjectsRoot, projectFolder, 'config.db'), false);

    for (let index = 0; index < images.length; index+=1) {
        const imageFile: Dirent = images[index];
        const imagePath = join(rootPath, imageFile.name);
        const dimensions = ImageSize(imagePath);
        console.assert(dimensions.width, `width is undefined for ${imagePath}`);
        console.assert(dimensions.height, `height is undefined for ${imagePath}`);

        // const url = `http://${WrapperHost}/identify_faces?file=${encodeURIComponent()}`;
        const frameFile = `frames/${imageFile.name}`;
        const frameInfo: FrameType = {
            filePath: frameFile,
            width: dimensions.width as number,
            height:dimensions.height as number,
            swappedToPath: null,
        };

        db
            .prepare('INSERT INTO frame(filePath, width, height, swappedToPath) VALUES (:filePath, :width, :height, :swappedToPath)')
            .run(frameInfo);

        try {
            // eslint-disable-next-line no-await-in-loop
            const facesCount: number = await IdentifyFaces(join(rootPath, imageFile.name))
                .then(faces => {

                    const stmt = db.prepare('INSERT INTO frameFace(value, frameFilePath, groupId, faceLibId) VALUES (:value, :frameFilePath, :groupId, :faceLibId)');
                    faces.forEach((face, faceIndex) => {
                        const frameFace: Omit<FrameFaceType, "id"> = {
                            value: JSON.stringify(face),
                            frameFilePath: frameFile,
                            groupId: faceIndex,
                            faceLibId: null,
                        };
                        stmt.run(frameFace);
                    });
                    return faces.length;
                });

            callback(index+1, images.length, facesCount, imageFile.name);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    return Promise.resolve();
}


export const SaveConfig = (projectFolder: string, config: ProjectType): Promise<void> => {
    // const fileDir = join(ProjectsRoot, projectFolder);
    // if(!existsSync(fileDir)) {
    //     console.log(`create dir ${fileDir}`);
    //     mkdirSync(fileDir, { recursive: true});
    // }

    const filePath = join(ProjectsRoot, projectFolder, 'config.db');

    const db = Database(filePath, false);
    const stmt = db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)');
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(config)) {
        stmt.run(key, JSON.stringify(value));
    }

    // const fileData = JSON.stringify(config, null, 4);
    console.log(`writing config to ${filePath}`, config);
    // console.log(fileData);
    // writeFileSync(filePath, fileData);
    return db
        .backup(filePath)
        .then(() => {
            console.log(`backup finished: ${filePath}`);
            Close(filePath);
            console.log(`db closed: ${filePath}`);
            Database(filePath, true);
            // return;
        });
        // .catch(console.error);
}
