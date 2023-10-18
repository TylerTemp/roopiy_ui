import { readdirSync, existsSync, mkdirSync, type Dirent, rmSync } from 'fs';
import { spawn, spawnSync } from 'child_process';
import { extname, join } from 'path';
import type ProjectType from '~s/Types/Project';
import type ApiPrepareProject from '~m/Project/ApiPrepareProject';
import WebSocket from 'ws';
// import { type FrameFaces } from '~s/Types/Edit';
import ImageSize from 'image-size';
import {ProjectsRoot, WrapperHost} from '../Utils/Config';
import { IdentifyFaces } from '../Utils/Face';
import Database, { Close } from '../Utils/DB/Database';
import { type FrameType, type FrameFaceType } from '../Utils/DB/Types';
import { ParseFFmpegTime } from "~s/Util";


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


export const CutVideoAsSource = (projectFolder: string, {referenceVideoFile, referenceVideoFrom, referenceVideoDuration}: ProjectType, callback: (cur: number, total: number, text: string) => void): Promise<string> => {
    const [_, fileExt] = extname(referenceVideoFile);
    const targetFileName = `target.${fileExt}`;
    return new Promise<string>((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
            '-hide_banner',
            '-y',
            '-ss',
            `${referenceVideoFrom}`,
            '-hwaccel',
            'auto',
            '-i',
            referenceVideoFile,
            '-acodec',
            'copy',
            '-vcodec',
            'copy',
            '-to',
            `${referenceVideoDuration}`,
            join(ProjectsRoot, projectFolder, targetFileName),
        ], { stdio: 'pipe', shell: false });

        ffmpeg.stdout.on('data', (data) => {
            // Process the ffmpeg output here, e.g., check for the "time" line and extract the progress information.
            const output = data.toString();
            const timeLine = /time=([^\s]+)/.exec(output);
            if (timeLine) {
                const currentTimeStr = timeLine[1];
                console.log('Current Time:', currentTimeStr);
                const currentTime = ParseFFmpegTime(currentTimeStr);
                callback(currentTime, referenceVideoDuration as number, `${currentTimeStr} ${referenceVideoFile}`)
            }
        });

        ffmpeg.stderr.on('data', (data) => {
            // Process ffmpeg error output, if needed.
            console.error(data.toString());
        });

        ffmpeg.on('close', (code) => {
            console.log(`ffmpeg process exited with code ${code}`);
            if(code === 0) {
                resolve(targetFileName);
            }
            else {
                reject(new Error(`ffmpeg exit with code ${code}`));
            }
        });
    });
}


export const ExtractVideo = (projectFolder: string, {sourceVideoToUse, referenceVideoSlice, referenceVideoDuration}: ProjectType, callback: (cur:number, total: number, text: string) => void): Promise<void> => {
    // 'ffmpeg',
    // '-hide_banner',
    // '-loglevel', 'error',
    // '-y'
    // -ss, time
    // '-hwaccel', 'auto',
    // '-i', target_path,
    // -acodec copy -vcodec copy
    // '-to', to
    const db = Database(join(ProjectsRoot, projectFolder, 'config.db'), true);
    const fileDir = join(ProjectsRoot, projectFolder);
    if(existsSync(fileDir)) {
        console.log(`purge dir ${fileDir}`);
        rmSync(fileDir, {recursive: true, force: true});
    }
    mkdirSync(fileDir, { recursive: true});

    callback(-1, -1, `Get video duration: ${referenceVideoSlice}`);

    const totalDuration: number = referenceVideoSlice
        ? referenceVideoDuration as number
        : GetVideoSeconds(sourceVideoToUse);

    callback(-1, -1, `Get video duration: ${totalDuration}`);

    return new Promise<void>((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
            '-hide_banner',
            '-y',
            '-hwaccel',
            'auto',
            '-i',
            sourceVideoToUse,
            join(ProjectsRoot, projectFolder, 'frames', '%06d.png'),
        ], { stdio: 'pipe', shell: false });

        ffmpeg.stdout.on('data', (data) => {
            // Process the ffmpeg output here, e.g., check for the "time" line and extract the progress information.
            const output = data.toString();
            const timeLine = /time=([^\s]+)/.exec(output);
            if (timeLine) {
                const currentTimeStr = timeLine[1];
                console.log('Current Time:', currentTimeStr);
                const currentTime = ParseFFmpegTime(currentTimeStr);
                callback(currentTime, totalDuration, `${currentTimeStr} ${sourceVideoToUse}`)
            }
        });

        ffmpeg.stderr.on('data', (data) => {
            // Process ffmpeg error output, if needed.
            console.error(data.toString());
        });

        ffmpeg.on('close', (code) => {
            console.log(`ffmpeg process exited with code ${code}`);
            if(code === 0) {
                db.prepare('DELETE * FROM frame').run();
                db.prepare('DELETE * FROM frameFace').run();
                resolve();
            }
            else {
                reject(new Error(`ffmpeg exit with code ${code}`));
            }
        });
    });
}


export const ExtractFacesInProject = async (projectFolder: string, callback: (curCount: number, totalCount: number, faceCount: number, name: string) => void): Promise<void> => {
    const rootPath: string = join(ProjectsRoot, projectFolder, 'frames');
    const images = readdirSync(rootPath, { withFileTypes: true })
        .filter(dirent => !dirent.isDirectory() && dirent.name.endsWith('.png'));

    const db = Database(join(ProjectsRoot, projectFolder, 'config.db'), false);

    for (let index = 0; index < images.length; index+=1) {
        const imageFile: Dirent = images[index];
        const frameFile = `frames/${imageFile.name}`;

        if(db.prepare(`SELECT filePath FROM frame WHERE filePath = ?`).get(frameFile)) {
            callback(index+1, images.length, 0, imageFile.name);
        }
        else
        {
            const imagePath = join(rootPath, imageFile.name);
            const dimensions = ImageSize(imagePath);
            console.assert(dimensions.width, `width is undefined for ${imagePath}`);
            console.assert(dimensions.height, `height is undefined for ${imagePath}`);

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
    }

    return Promise.resolve();
}


export const SaveConfig = (projectFolder: string, config: ProjectType): void => {

    const folderPath = join(ProjectsRoot, projectFolder);
    if(!existsSync(folderPath)) {
        console.log(`create dir ${folderPath}`);
        mkdirSync(folderPath, { recursive: true});
    }

    const filePath = join(folderPath, 'config.db');

    console.log(`writing config to ${filePath}`, config);

    const db = Database(filePath, true);
    const stmt = db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)');
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(config)) {
        stmt.run(key, JSON.stringify(value));
    }

    // // const fileData = JSON.stringify(config, null, 4);
    // console.log(`writing config to ${filePath}`, config);
    // // console.log(fileData);
    // // writeFileSync(filePath, fileData);
    // return db
    //     .backup(filePath)
    //     .then(() => {
    //         console.log(`backup finished: ${filePath}`);
    //         Close(filePath);
    //         console.log(`db closed: ${filePath}`);
    //         Database(filePath, true);
    //         // return;
    //     });
        // .catch(console.error);
}
