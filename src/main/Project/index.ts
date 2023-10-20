import { readdirSync, existsSync, mkdirSync, type Dirent, rmSync } from 'fs';
import { spawn, spawnSync } from 'child_process';
import { extname, join } from 'path';
import type ProjectType from '~s/Types/Project';
// import { type FrameFaces } from '~s/Types/Edit';
import ImageSize from 'image-size';
import { BrowserWindow } from 'electron';
import {ProjectsRoot} from '../Utils/Config';
import { IdentifyFaces } from '../Utils/Face';
import Database from '../Utils/DB/Database';
import { type FrameType, type FrameFaceType } from '../Utils/DB/Types';
import { ParseFFmpegTime } from "../../shared/Util";


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
    const db = Database(filePath);
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
    const fileExt = extname(referenceVideoFile);
    const targetFileName = `target${fileExt}`;

    const focusedWindow = BrowserWindow.getFocusedWindow();
    focusedWindow?.setProgressBar(0);

    console.log(`CutVideoAsSource`, referenceVideoFile, referenceVideoFrom, referenceVideoDuration, targetFileName);

    return new Promise<string>((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
            '-hide_banner',
            '-y',
            '-ss',
            `${referenceVideoFrom}`,
            '-hwaccel',
            'auto',
            '-progress', 'pipe:1',
            '-i',
            referenceVideoFile,
            '-acodec',
            'copy',
            '-vcodec',
            'copy',
            '-to',
            `${referenceVideoDuration}`,
            join(ProjectsRoot, projectFolder, targetFileName),
        ]);

        ffmpeg.stdout.on('data', (data) => {
            // Process the ffmpeg output here, e.g., check for the "time" line and extract the progress information.
            const output = data.toString();
            // console.log(`CutVideoAsSource ffmpeg output: ${output}`);

            const timeLine = /time=([^\s]+)/.exec(output);
            if (timeLine) {
                const currentTimeStr = timeLine[1];
                console.log('CutVideoAsSource Current Time:', currentTimeStr);
                const currentTime = ParseFFmpegTime(currentTimeStr);
                callback(currentTime, referenceVideoDuration as number, `${currentTimeStr} ${referenceVideoFile}`);
                focusedWindow?.setProgressBar(currentTime / (referenceVideoDuration as number));
            }
        });

        ffmpeg.stderr.on('data', (data) => {
            // Process ffmpeg error output, if needed.
            // console.error(`CutVideoAsSource ERROR:`, data.toString());
        });

        ffmpeg.on('close', (code) => {
            console.log(`CutVideoAsSource ffmpeg process exited with code ${code}`);
            if(code === 0) {
                resolve(targetFileName);
            }
            else {
                reject(new Error(`CutVideoAsSource ffmpeg exit with code ${code}`));
            }
        });
    });
}


export const ExtractVideo = (projectFolder: string, {sourceVideoToUse, sourceVideoAbs, referenceVideoSlice, referenceVideoDuration}: ProjectType, callback: (cur:number, total: number, text: string) => void): Promise<void> => {
    const db = Database(join(ProjectsRoot, projectFolder, 'config.db'));
    const focusedWindow = BrowserWindow.getFocusedWindow();
    focusedWindow?.setProgressBar(0);

    const fileDir = join(ProjectsRoot, projectFolder, 'frames');
    if(existsSync(fileDir)) {
        console.log(`purge dir ${fileDir}`);
        rmSync(fileDir, {recursive: true, force: true});
    }
    mkdirSync(fileDir, { recursive: true});

    callback(-1, -1, `Get video duration: ${referenceVideoSlice}`);
    const sourceVideoPath = sourceVideoAbs
        ? sourceVideoToUse
        : join(ProjectsRoot, projectFolder, sourceVideoToUse);

    const totalDuration: number = referenceVideoSlice
        ? referenceVideoDuration as number
        : GetVideoSeconds(sourceVideoPath);

    callback(-1, -1, `Get video duration: ${totalDuration}`);

    return new Promise<void>((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
            '-hide_banner',
            '-y',
            '-hwaccel',
            'auto',
            '-progress', 'pipe:1',
            '-i',
            sourceVideoPath,
            '-pix_fmt', 'rgb24',
            '-vf', 'fps=30',
            join(ProjectsRoot, projectFolder, 'frames', '%06d.png'),
        ], { stdio: 'pipe', shell: false });

        ffmpeg.stdout.on('data', (data) => {
            // Process the ffmpeg output here, e.g., check for the "time" line and extract the progress information.
            const output = data.toString();
            const timeLine = /time=([^\s]+)/.exec(output);
            // console.log(`get output: ${output}, match: ${timeLine}`);
            if (timeLine) {
                const currentTimeStr = timeLine[1];
                console.log('ExtractVideo Current Time:', currentTimeStr);
                const currentTime = ParseFFmpegTime(currentTimeStr);
                callback(currentTime, totalDuration, `${currentTimeStr} ${sourceVideoToUse}`);
                focusedWindow?.setProgressBar(currentTime/totalDuration);
            }
        });

        ffmpeg.stderr.on('data', (data) => {
            // Process ffmpeg error output, if needed.
            console.error(data.toString());
        });

        ffmpeg.on('close', (code) => {
            console.log(`ExtractVideo ffmpeg process exited with code ${code}`);
            if(code === 0) {
                db.prepare('DELETE FROM frame').run();
                db.prepare('DELETE FROM frameFace').run();
                resolve();
            }
            else {
                reject(new Error(`ExtractVideo ffmpeg exit with code ${code}`));
            }
        });
    });
}


export const ExtractFacesInProject = async (projectFolder: string, callback: (curCount: number, totalCount: number, faceCount: number, name: string) => void): Promise<void> => {
    const rootPath: string = join(ProjectsRoot, projectFolder, 'frames');
    const images = readdirSync(rootPath, { withFileTypes: true })
        .filter(dirent => !dirent.isDirectory() && dirent.name.endsWith('.png'));

    const db = Database(join(ProjectsRoot, projectFolder, 'config.db'));

    const focusedWindow = BrowserWindow.getFocusedWindow();

    console.log(`png count: ${images.length}`)

    for (let index = 0; index < images.length; index+=1) {
        const imageFile: Dirent = images[index];
        const frameFile = `frames/${imageFile.name}`;
        let faceCount = 0;

        if(!db.prepare(`SELECT filePath FROM frame WHERE filePath = ?`).get(frameFile))
        {
            console.log(imageFile.name);
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
                faceCount = await IdentifyFaces(join(rootPath, imageFile.name))
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

                // callback(index+1, images.length, facesCount, imageFile.name);
            } catch (error) {
                db
                    .prepare('DELETE FROM frame WHERE filePath = ?')
                    .run(frameInfo.filePath);
                focusedWindow?.setProgressBar(0);
                return Promise.reject(error);
            }
        }
        callback(index+1, images.length, faceCount, imageFile.name);
        focusedWindow?.setProgressBar((index+1)/images.length);
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

    const db = Database(filePath);
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
