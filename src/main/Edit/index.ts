import { type FrameFaces } from "~s/Types/Edit";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import ImageSize from 'image-size';
import { type ISize } from 'image-size/dist/types/interface';
import {ProjectsRoot} from '../Utils/Config';

export const GetImageSize = (imagePath: string): ISize => ImageSize(imagePath);

export const GetProjectFrameFaces = (projectFolder: string): FrameFaces[] => {
    const frameFolder: string = join(ProjectsRoot, projectFolder, 'frames');

    const pngFileNames = readdirSync(frameFolder, { withFileTypes: true })
        .filter(dirent => dirent.isFile())
        .map(dirent => dirent.name)
        .filter(fileName => fileName.endsWith('.png'));

    return pngFileNames.map((pngFile: string): FrameFaces => {
        const pngPath = join(frameFolder, pngFile);
        const faceFile = `${pngPath}.json`;

        const faceFileData = readFileSync(faceFile, {encoding: 'utf-8'});

        const frameFaces: FrameFaces = JSON.parse(faceFileData.toString()) as FrameFaces;
        console.assert(frameFaces.frameFile === pngFile, `frameFile ${frameFaces.frameFile} !== ${pngFile}`);

        return frameFaces;
    });
}