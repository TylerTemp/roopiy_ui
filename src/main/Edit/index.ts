import { type FrameFaces } from "~s/Types/Edit";
import { join } from "path";
import ImageSize from 'image-size';
import { type ISize } from 'image-size/dist/types/interface';
import Face from "~s/Types/Face";
import {ProjectsRoot} from '../Utils/Config';
import Database, {type FrameType, type FrameFaceType} from '../Utils/Database';

export const GetImageSize = (imagePath: string): ISize => ImageSize(imagePath);

export const GetProjectFrameFaces = (projectFolder: string): FrameFaces[] => {
    const db = Database(join(ProjectsRoot, projectFolder, 'config.db'), true);
    const frames = db.prepare('SELECT * FROM frame').all() as FrameType[];

    return frames.map((frame: FrameType): FrameFaces => {
        // const frameFaces:  = {
        //     frameFile: frame.filePath,
        //     // faces: [],
        // };

        const dbFaces = db.prepare('SELECT * FROM frame_face WHERE frameFilePath = ?').all(frame.filePath) as FrameFaceType[];
        const faces = dbFaces.map(({value}: FrameFaceType): Face => JSON.parse(value));

        return {
            frameFile: frame.filePath,
            faces,
            width: frame.width,
            height: frame.height,
        };
    });
    // const frameFolder: string = join(ProjectsRoot, projectFolder, 'frames');

    // const pngFileNames = readdirSync(frameFolder, { withFileTypes: true })
    //     .filter(dirent => dirent.isFile())
    //     .map(dirent => dirent.name)
    //     .filter(fileName => fileName.endsWith('.png'));

    // return pngFileNames.map((pngFile: string): FrameFaces => {
    //     const pngPath = join(frameFolder, pngFile);
    //     const faceFile = `${pngPath}.json`;

    //     const faceFileData = readFileSync(faceFile, {encoding: 'utf-8'});

    //     const frameFaces: FrameFaces = JSON.parse(faceFileData.toString()) as FrameFaces;
    //     console.assert(frameFaces.frameFile === pngFile, `frameFile ${frameFaces.frameFile} !== ${pngFile}`);

    //     return frameFaces;
    // });
}