import { type FrameFaces, type FrameFace } from "~s/Types/Edit";
import { join, extname, dirname } from "path";
import ImageSize from 'image-size';
import { type ISize } from 'image-size/dist/types/interface';
import { copyFileSync, existsSync, mkdirSync } from "fs";
import sharp from "sharp";
import { spawnSync } from "child_process";
import Face from "../../shared/Types/Face";
import {ProjectsRoot} from '../Utils/Config';
import Database from '../Utils/DB/Database';
import {type FrameType, type FrameFaceType, type FaceLibType} from '../Utils/DB/Types';
import { GetRectFromFace, Rect } from "../../shared/Face";
import { clamp } from "../../shared/Util";
import { ParsedFaceLibType, UpdateFrameFaceType } from "./Types";
import roopiy from "../Utils/Roopiy";
import { BrowserWindow } from "electron";

export const GetImageSize = (imagePath: string): ISize => ImageSize(imagePath);

// type FrameFacesNoFaces = Omit<FrameFaces, "faces">;

const PadTo2Digits = (num: number): string => {
    return num.toString().padStart(2, '0');
  }

const ConvertMsToTime = (milliseconds: number):string => {
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    seconds %= 60;
    minutes %= 60;

    // 👇️ If you want to roll hours over, e.g. 00 to 24
    // 👇️ uncomment the line below
    // uncommenting next line gets you `00:00:00` instead of `24:00:00`
    // or `12:15:31` instead of `36:15:31`, etc.
    // 👇️ (roll hours over)
    // hours = hours % 24;

    return `${PadTo2Digits(hours)}:${PadTo2Digits(minutes)}:${PadTo2Digits(
      seconds,
    )}`;
  }

interface FrameNestedQueryType extends FrameType {
    frameFaces: string,
}

export const GetProjectFrameFaces = (projectFolder: string, callback: (cur: number, total: number) => void): FrameFaces[] => {
    const db = Database(join(ProjectsRoot, projectFolder, 'config.db'));
    // id: number,
    // value: string,
    // groupId: number,
    // faceLibId: number | null,
    // frameFilePath: string,

    const focusedWindow = BrowserWindow.getFocusedWindow();
    focusedWindow?.setProgressBar(0);

    const {total} = db.prepare('SELECT COUNT(*) AS total FROM frame').get() as {total: number};

    // // const totalCount = total as number;
    let offset = 0;
    const limit = 100;
    const allResults: FrameFaces[] = []
    while(true) {
        // callback(offset, total);
        const startTime = new Date();
        // console.log(`query all frames`, offset, limit);
        const frames = db.prepare(`
            SELECT
                frame.*,
                (
                    SELECT json_group_array(json_object(
                        'frameFilePath', frameFace.frameFilePath,
                        'faceLibId', frameFace.faceLibId,
                        'groupId', frameFace.groupId,
                        'value', frameFace.value,
                        'id', frameFace.id
                    ))
                    FROM frameFace
                    WHERE frameFace.frameFilePath = frame.filePath
                ) AS frameFaces
            FROM frame
            LIMIT ${limit}
            OFFSET ${offset}
        `).all() as FrameNestedQueryType[];

        const usedTime = (new Date()).getTime() - startTime.getTime();

        // console.log(`query all frames finished`, ConvertMsToTime(usedTime), frames.length);
        if(frames.length === 0) {
            focusedWindow?.setProgressBar(0);
            return allResults;
        }

        // const frames = db.prepare('SELECT * FROM frame').all() as FrameType[];
        const results: FrameFaces[] = frames.map(({frameFaces: frameFacesStr, ...FrameTypeArgs}): FrameFaces => {
            const frame: FrameType = FrameTypeArgs as FrameType;

            // const dbFaces = db.prepare('SELECT * FROM frameFace WHERE frameFilePath = ?').all(frame.filePath) as FrameFaceType[];
            // const frameFaces: FrameFace[] = dbFaces.map(
            //     ({value, ...left}: FrameFaceType): FrameFace => ({
            //         ...left,
            //         face: JSON.parse(value),
            //     })
            // );
            const frameFaces: FrameFace[] = (JSON.parse(frameFacesStr) as FrameFaceType[])
                .map(({value, ...frameFaceLeft}) => ({
                    ...frameFaceLeft,
                    face: JSON.parse(value),
                }))

            return {
                ...frame,
                faces: frameFaces,
            };
        });

        offset += results.length;
        callback(offset, total);
        focusedWindow?.setProgressBar(offset/total);
        allResults.push(...results);
    }
}



export const GetAllFacesInFaceLib = (projectFolder: string): ParsedFaceLibType[] => {
    const db = Database(join(ProjectsRoot, projectFolder, 'config.db'));
    const dbFaces = db.prepare('SELECT * FROM faceLib WHERE hide=0').all() as FaceLibType[];
    return dbFaces.map(({value, hide, ...left}: FaceLibType): ParsedFaceLibType => ({
        ...left,
        hide: hide !== 0,
        face: JSON.parse(value) as Face,
    }));
}


const PandingRect = (fullWidth: number, fullHeight: number, {top, right, bottom, left}: Rect): Rect => {
    const width = right - left;
    const height = bottom - top;
    // const leftSpace = left;
    // const rightSpace = fullWidth - right;
    // const topSpace = top;
    // const bottomSpace =
    let resultRect: Rect;
    if(width > height) {
        const delta = Math.floor((width - height) / 2);
        resultRect = {
            top: top - delta,
            right,
            bottom: bottom + delta,
            left
        };
    }
    else {
        const delta = Math.floor((height - width) / 2);
        resultRect = {
            top,
            right: right + delta,
            bottom,
            left: left - delta
        };
    }
    if(resultRect.top < 0) {
        resultRect.bottom -= resultRect.top;
        resultRect.top = 0;
    }
    else if (resultRect.bottom > fullHeight) {
        resultRect.top -= (fullHeight - resultRect.bottom);
        resultRect.bottom = fullHeight;
    }

    if(resultRect.left < 0) {
        resultRect.right -= resultRect.left;
        resultRect.left = 0;
    }
    else if (resultRect.right > fullWidth) {
        resultRect.left -= (fullWidth - resultRect.right);
        resultRect.right = 0;
    }

    return {
        left: clamp(resultRect.left, 0, fullWidth),
        right: clamp(resultRect.right, 0, fullWidth),
        top: clamp(resultRect.top, 0, fullHeight),
        bottom: clamp(resultRect.bottom, 0, fullHeight),
    }
}


export const SaveFaceLib = async (projectFolder: string, face: Face, file: string, alias: string): Promise<ParsedFaceLibType> => {
    const db = Database(join(ProjectsRoot, projectFolder, 'config.db'));
    const ext = extname(file);
    const tagetFaceFolder = join(ProjectsRoot, projectFolder, 'faces');
    if (!existsSync(tagetFaceFolder)) {
        mkdirSync(tagetFaceFolder, { recursive: true });
    }
    // const targetFaceFile = join(tagetFaceFolder, `${alias}${ext}`);
    const value = JSON.stringify(face);
    const faceLib: Omit<FaceLibType, "id" | "file" | "fullFile"> = {
        value,
        // file: null,
        // fullFile: null,
        alias,
        hide: 0,
    }
    // console.log(`add new face`, faceLib);
    const {lastInsertRowid} = db.prepare('INSERT INTO faceLib (value, alias, hide) VALUES (:value, :alias, :hide)').run(faceLib);
    const faceId = lastInsertRowid as number;

    const targetFullFileName = `${faceId}_${alias}_full${ext}`;
    const targetFullFilePath = join(tagetFaceFolder, targetFullFileName);
    copyFileSync(file, targetFullFilePath);

    const targetFileName = `${faceId}_${alias}_face${ext}`;
    const targetFilePath = join(tagetFaceFolder, targetFileName);
    const {width, height} = GetImageSize(targetFullFilePath);
    const {top, right, bottom, left} = PandingRect(width as number, height as number, GetRectFromFace(face));
    await sharp(targetFullFilePath)
        .extract({left: Math.floor(left), top: Math.floor(top), width: Math.floor(right - left), height: Math.floor(bottom - top)})
        .toFile(targetFilePath);

    const savedFaceLib: FaceLibType = {
        ...faceLib,
        id: faceId,
        file: `faces/${targetFileName}`,
        fullFile: `faces/${targetFullFileName}`,
    };

    db.prepare('UPDATE faceLib SET file=:file, fullFile=:fullFile WHERE id=:id').run(savedFaceLib);

    const result: ParsedFaceLibType = {
        id: faceId,
        face,
        hide: false,
        file: `faces/${targetFileName}`,
        fullFile: `faces/${targetFullFileName}`,
        alias,
    };

    return result;
    // return faceId;
}


export const UpdateFrameFaces = (projectFolder: string, buckChanges: UpdateFrameFaceType[], callback: (cur: number) => void): void => {
    const db = Database(join(ProjectsRoot, projectFolder, 'config.db'));

    for (let index = 0; index < buckChanges.length; index+=1) {
        const {id, ...changes} = buckChanges[index];
        const keys = Object.keys(changes);
        console.assert(keys.length > 0, 'changes should not be empty');
        db.prepare(`UPDATE frameFace SET ${keys.map(key => `${key}=:${key}`).join(", ")} WHERE id=:id`).run({
            ...changes,
            id,
        });
        callback(index+1);
    }
}


interface SourceTargetJson {
    sourceStr: string,
    targetStr: string,
}


export const GenerateProject = async (projectFolder: string, callback: (cur: number, total: number, text: string) => void): Promise<string> => {
    const db = Database(join(ProjectsRoot, projectFolder, 'config.db'));

    const focusedWindow = BrowserWindow.getFocusedWindow();
    focusedWindow?.setProgressBar(0);

    const configInfo = db.prepare("SELECT key, value FROM config WHERE key='sourceVideoToUse' OR key='sourceVideoAbs'").all() as {key: string, value: string}[];

    const configMap = new Map<string, string>(configInfo.map(({key, value}) => [key, value]));
    const sourceVideoToUse = JSON.parse(configMap.get('sourceVideoToUse')!) as string;
    const sourceVideoAbs = JSON.parse(configMap.get('sourceVideoAbs')!) as boolean;

    const mp4SourcePath = sourceVideoAbs
        ? sourceVideoToUse
        : join(ProjectsRoot, projectFolder, sourceVideoToUse);

    callback(-1, -1, `loading faceLib`);

    const allFaceLib = db.prepare('SELECT * FROM faceLib').all() as FaceLibType[];
    const faceLibIdToFaceJsonMapString = new Map<number, string>();
    allFaceLib.forEach(({id, value}) => faceLibIdToFaceJsonMapString.set(id, value));

    callback(-1, -1, `loading frames`);

    const allFilePath =
        db
            .prepare('SELECT filePath FROM frame')
            .all() as {filePath: string}[];

    const targetFolderPath = join(ProjectsRoot, projectFolder, 'swap');
    if(!existsSync(targetFolderPath)) {
        mkdirSync(targetFolderPath, { recursive: true });
    }

    callback(-1, -1, `start swap`);

    // swap
    for (let index = 0; index < allFilePath.length; index+=1) {
        const {filePath} = allFilePath[index];

        const frameFaceRaws = db
            .prepare(`
                SELECT faceLibId, value
                FROM frameFace
                WHERE faceLibId IS NOT NULL
                  AND frameFace.frameFilePath = ?
            `)
            .all(filePath) as FrameFaceType[];

        const parsedInfos: SourceTargetJson[] = frameFaceRaws.map(({faceLibId, value}): SourceTargetJson => {
                const targetFaceStr = faceLibIdToFaceJsonMapString.get(faceLibId as number);
                console.assert(targetFaceStr, `${filePath} ${faceLibId}`);
                return ({
                    sourceStr: value as string,
                    targetStr: targetFaceStr as string,
                });
            });

        const sourcePath = join(ProjectsRoot, projectFolder, filePath);
        const targetPath = join(targetFolderPath, filePath.replaceAll('frames/', ''));

        if(parsedInfos.length === 0) {
            // just copy
            copyFileSync(sourcePath, targetPath);
        }
        else {
            // const arrayItems = parsedInfos.map(({sourceStr, targetStr}) => `{
            //     "source": ${sourceStr},
            //     "target": ${targetStr}
            // }`);

            // const bodyJson = `[
            //     ${arrayItems.join(",\n")}
            // ]`;
            const swapInfo = parsedInfos.map(({sourceStr, targetStr}) => ({
                source: JSON.parse(sourceStr),
                target: JSON.parse(targetStr),
            }));

            // console.log(bodyJson);

            // eslint-disable-next-line no-await-in-loop
            await roopiy.Send(JSON.stringify({
                'method': 'swap_faces',
                'payload': {
                    'source_image_path': sourcePath,
                    'target_image_path': targetPath,
                    'swap_info': swapInfo,
                }
            }));
            // await fetch(`http://${WrapperHost}/swap-faces?from_file=${encodeURIComponent(sourcePath)}&to_file=${encodeURIComponent(targetPath)}`, {
            //         method: 'POST',
            //         body: bodyJson,
            //         headers: {
            //             'Content-Type': 'application/json',
            //         }
            //     })
            //         .then(resp => {
            //             console.assert(resp.ok);
            //             return resp.text();
            //         })
            //         .then(resp => {
            //             console.log(resp);
            //     });
        }

        callback(index+1, allFilePath.length, `${index+1}/${allFilePath.length} - ${filePath}`);
        focusedWindow?.setProgressBar((index+1)/allFilePath.length);
    }

    // mp4
    callback(-1, -1, `creating video`);
    const mp4TempPath = join(ProjectsRoot, projectFolder, 'output_slient.mp4');

    const createArgs: string[] = [
        '-hide_banner',
        '-loglevel', 'error',
        '-hwaccel', 'auto',
        '-r', `30`,  // fps
        '-i', join(targetFolderPath, '%06d.png'),
        '-c:v', 'libx264',
        // '-crf', str(output_video_quality),
        '-pix_fmt', 'yuv420p',
        '-vf', 'colorspace=bt709:iall=bt601-6-625:fast=1',
        '-y', mp4TempPath
    ];

    const silentResult = spawnSync('ffmpeg', createArgs, { encoding: 'utf-8', shell: false });
    console.assert(silentResult.status === 0);

    callback(-1, -1, `merge audio`);
    const mp4Path = join(ProjectsRoot, projectFolder, 'output.mp4');
    const audioArgs = [
        '-hide_banner',
        '-loglevel', 'error',
        '-hwaccel', 'auto',
        '-i', mp4TempPath,
        '-i', mp4SourcePath,
        '-c:v', 'copy',
        '-map', '0:v:0',
        '-map', '1:a:0',
        '-y',
        mp4Path
    ];

    const audioResult = spawnSync('ffmpeg', audioArgs, { encoding: 'utf-8', shell: false });
    console.assert(audioResult.status === 0);

    focusedWindow?.setProgressBar(0);

    return Promise.resolve(mp4Path);
}

export interface FrameTypePreview {
    filePath: string,
    swapInfo: {
        source: Face,
        target: Face,
    }[],
}

export const PreviewFrameSwap = (projectFolder: string, {filePath, swapInfo}: FrameTypePreview): Promise<string> => {
    const swapFile = join('swap', filePath.replaceAll('frames/', ''));
    const swapToPath = join(ProjectsRoot, projectFolder, swapFile);
    const swapDir = dirname(swapToPath);
    if(!existsSync(swapDir)) {
        mkdirSync(swapDir, { recursive: true });
    }
    const sourcePath = join(ProjectsRoot, projectFolder, filePath);

    console.log(`frame swap to`, swapFile);

    return roopiy.Send(JSON.stringify({
        'method': 'swap_faces',
        'payload': {
            'source_image_path': sourcePath,
            'target_image_path': swapToPath,
            'swap_info': swapInfo,
        }
    }))
        .then(() => swapFile.replaceAll('\\', '/'));
}
