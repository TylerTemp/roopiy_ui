import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { spawnSync } from 'child_process';
import { join } from 'path';
import type ProjectType from '~s/Types/Project';
import type ApiPrepareProject from '~m/Project/ApiPrepareProject';
import {ProjectsRoot, WrapperUrl} from '../Utils/Config';
import { ProjectEdit } from '~s/Types/Project';


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

export const GetVideoSeconds = (videoFile: string): number => {
    const args: string[] = ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=duration', '-of',
        'json=compact=1', videoFile];
    const result = spawnSync('ffprob', args, { encoding: 'utf-8', shell: true });
    console.assert(!result.error, result.error);
    const outputAsJSON = JSON.parse(result.stdout);
    const durationStr = outputAsJSON['streams'][0]['duration'];
    const duration: number = parseFloat(durationStr);
    console.assert(!isNaN(duration), `duration is NaN: ${durationStr}`);
    return duration;
}


// const EstimateImageCount = ({referenceVideoFile, referenceVideoSlice, referenceVideoFrom, referenceVideoDuration}: ProjectType): number => {
//     const totalSeconds = GetVideoSeconds(referenceVideoFile);
//     console.log(`totalSeconds: ${totalSeconds} / ${referenceVideoFile}`);
//     let sliceSeconds: number = totalSeconds;
//     if(referenceVideoSlice) {
//         // const {fromSecond, toSecond} = ParseSlice(config);
//         // console.assert(referenceVideoFrom >= 0, referenceVideoFrom);
//         // console.assert(toSecond <= totalSeconds, toSecond);
//         console.assert(referenceVideoFrom !== null);
//         console.assert(referenceVideoDuration !== null);
//         sliceSeconds = referenceVideoDuration;
//     }

//     return 30 * sliceSeconds;
// }

// const ParseSlice = ({referenceVideoFrom, referenceVideoTo}: Pick<ProjectType, "referenceVideoFrom" | "referenceVideoTo">): {fromSecond: number, toSecond: number | null} => {
//     let fromSecond: number | null = null;
//     let toSecond: number | null = null;

//     fromSecond = referenceVideoFrom === '' ? 0: ParseFFmpegTime(referenceVideoFrom);

//     console.log(`from: ${referenceVideoFrom} -> ${fromSecond}`);

//     if (referenceVideoTo !== '') {
//         toSecond = ParseFFmpegTime(referenceVideoTo);
//         console.assert(!isNaN(toSecond), `toSecond is NaN: ${referenceVideoTo}`);
//     } else {
//         if (referenceVideoFrom === '') {
//             throw new Error('Invalid fromRaw value');
//         }
//     }

//     return {fromSecond, toSecond};
// }


// export const ParseProjectForServer = (projectFolder: string, config: ProjectEdit): ApiPrepareProject => {
//     const fileDir = join(ProjectsRoot, projectFolder);
//     if(!existsSync(fileDir)) {
//         console.log(`create dir ${fileDir}`);
//         mkdirSync(fileDir, { recursive: true});
//     }

//     const {referenceVideoFile, referenceVideoSlice} = config;
//     const totalSeconds = GetVideoSeconds(referenceVideoFile);
//     console.log(`totalSeconds: ${totalSeconds} / ${referenceVideoFile}`);
//     let sliceSeconds: number = totalSeconds;
//     if(referenceVideoSlice) {
//         const {fromSecond, toSecond} = ParseSlice(config);
//         console.assert(fromSecond >= 0, fromSecond);
//         // console.assert(toSecond <= totalSeconds, toSecond);
//         if(toSecond !== null) {
//             console.assert(toSecond <= totalSeconds, toSecond);
//             console.assert(toSecond > fromSecond, `${fromSecond} -> ${toSecond}`);
//             sliceSeconds = toSecond - fromSecond;
//         }
//         else {
//             sliceSeconds = totalSeconds - fromSecond;
//         }
//     }

//     return;
// }


export const ExtractVideo = (projectFolder: string, config: ProjectType): Promise<void> => {
    const fileDir = join(ProjectsRoot, projectFolder);
    if(!existsSync(fileDir)) {
        console.log(`create dir ${fileDir}`);
        mkdirSync(fileDir, { recursive: true});
    }

    // const {referenceVideoFile, referenceVideoSlice} = config;
    // const totalSeconds = GetVideoSeconds(referenceVideoFile);
    // console.log(`totalSeconds: ${totalSeconds} / ${referenceVideoFile}`);
    // let sliceSeconds: number = totalSeconds;
    // if(referenceVideoSlice) {
    //     const {fromSecond, toSecond} = ParseSlice(config);
    //     console.assert(fromSecond >= 0, fromSecond);
    //     // console.assert(toSecond <= totalSeconds, toSecond);
    //     if(toSecond !== null) {
    //         console.assert(toSecond <= totalSeconds, toSecond);
    //         console.assert(toSecond > fromSecond, `${fromSecond} -> ${toSecond}`);
    //         sliceSeconds = toSecond - fromSecond;
    //     }
    //     else {
    //         sliceSeconds = totalSeconds - fromSecond;
    //     }
    // }

    // const estimatedImageCount = Math.round(sliceSeconds * 30);  // 30=fps

    const apiPrepareProjeec: ApiPrepareProject = {
        Path: fileDir,
        Project: config,
    }

    return fetch(WrapperUrl + `/extract_video`, {
        method: 'POST',
        body: JSON.stringify(apiPrepareProjeec),
        headers: {
            'Content-Type': 'application/json',
        }
    })
        .then(resp => resp.text())
        .then(resp => {
            console.log(resp);
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
    console.log(`writing config to ${filePath}`);
    console.log(fileData);
    writeFileSync(filePath, fileData);
}
