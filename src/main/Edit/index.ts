import { type FrameFaces, type FrameFace } from "~s/Types/Edit";
import { join, extname } from "path";
import ImageSize from 'image-size';
import { type ISize } from 'image-size/dist/types/interface';
import Face from "../../shared/Types/Face";
import {ProjectsRoot} from '../Utils/Config';
import Database, {type FrameType, type FrameFaceType, type FaceLibType} from '../Utils/Database';
import { copyFile, copyFileSync, existsSync, mkdirSync } from "fs";
import sharp from "sharp";
import { GetRectFromFace, Rect } from "../../shared/Face";
import { clamp } from "../../shared/Util";

export const GetImageSize = (imagePath: string): ISize => ImageSize(imagePath);

// type FrameFacesNoFaces = Omit<FrameFaces, "faces">;

export const GetProjectFrameFaces = (projectFolder: string, callback: (cur: number, total: number) => void): FrameFaces[] => {
    const db = Database(join(ProjectsRoot, projectFolder, 'config.db'), true);
    // id: number,
    // value: string,
    // groupId: number,
    // faceLibId: number | null,
    // frameFilePath: string,

    const {total} = db.prepare('SELECT COUNT(*) AS total FROM frame').get() as {total: number};

    // // const totalCount = total as number;
    let offset = 0;
    const limit = 100;
    const allResults: FrameFaces[] = []
    while(true) {
        callback(offset, total);
        console.log(`query all frames`, offset, limit);
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
        `).all() as FrameType[];

        console.log(`query all frames finished`, frames.length);
        if(frames.length === 0) {
            return allResults;
        }

        // const frames = db.prepare('SELECT * FROM frame').all() as FrameType[];
        const results: FrameFaces[] = frames.map((frame: FrameType): FrameFaces => {

            const dbFaces = db.prepare('SELECT * FROM frameFace WHERE frameFilePath = ?').all(frame.filePath) as FrameFaceType[];
            const frameFaces: FrameFace[] = dbFaces.map(
                ({value, ...left}: FrameFaceType): FrameFace => ({
                    ...left,
                    face: JSON.parse(value),
                })
            );

            return {
                ...frame,
                faces: frameFaces,
            };
        });

        offset += results.length;
        callback(offset, total);
        allResults.push(...results);
    }


    // console.log(`query all frames finished`, framesSqlResults.length);

    // return ;
    // const frames = db.prepare('SELECT * FROM frame').all() as FrameType[];

    // return frames.map((frame: FrameType): FrameFaces => {

    //     const dbFaces = db.prepare('SELECT * FROM frameFace WHERE frameFilePath = ?').all(frame.filePath) as FrameFaceType[];
    //     const frameFaces: FrameFace[] = dbFaces.map(
    //         ({value, ...left}: FrameFaceType): FrameFace => ({
    //             ...left,
    //             face: JSON.parse(value),
    //         })
    //     );

    //     return {
    //         frameFile: frame.filePath,
    //         faces: frameFaces,
    //         width: frame.width,
    //         height: frame.height,
    //     };
    // });
}

export interface ParsedFaceLibType extends Omit<FaceLibType, "value" | "hide"> {
    face: Face,
    hide: boolean,
}

export const GetAllFacesInFaceLib = (projectFolder: string): ParsedFaceLibType[] => {
    const db = Database(join(ProjectsRoot, projectFolder, 'config.db'), true);
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
    const db = Database(join(ProjectsRoot, projectFolder, 'config.db'), true);
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
    console.log(`add new face`, faceLib);
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