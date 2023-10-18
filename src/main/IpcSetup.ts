import type { IpcMain } from 'electron';
import ProjectType from '~s/Types/Project';
import Face from '~s/Types/Face';
import Channel from './IpcChannel';
import { GetList, ExtractVideo, GetConfig, GetVideoSeconds, ExtractFacesInProject, SaveConfig, CutVideoAsSource } from './Project';
import { GetProjectFrameFaces, GetImageSize, GetAllFacesInFaceLib, SaveFaceLib, UpdateFrameFaces, GenerateProject, PreviewFrameSwap, FrameTypePreview } from './Edit';
import { UpdateFrameFaceType } from './Edit/Types';
import { IdentifyFaces } from './Utils/Face';
import { Close } from './Utils/DB/Database';

export default (ipcMain: IpcMain): void => {

    ipcMain.handle(Channel.Project.k, async (event, ...args) => {
        switch (args[0]) {
            case Channel.Project.v.GetList:
                return GetList();
            case Channel.Project.v.GetConfig:
                return GetConfig(args[1]);
            case Channel.Project.v.GetVideoSeconds:
                return GetVideoSeconds(args[1]);
            case Channel.Project.v.CutVideoAsSource:
            {
                const [_, channelName, projectFolder, config] = args;
                return CutVideoAsSource(projectFolder as string, config as ProjectType, (cur: number, total: number, text: string) => {
                    // console.log(`emit ${channelName} ${count}`)
                    event.sender.send(channelName, cur, total, text);
                });
            }
            case Channel.Project.v.ExtractVideo:
            {
                const [_, channelName, folder, projectType] = args;
                const result: Promise<void> = ExtractVideo(folder,
                    projectType,
                    (cur:number, total: number, text: string) => {
                        // console.log(`emit ${channelName} ${count}`)
                        event.sender.send(channelName, cur, total, text);
                    });
                return result;
            }
            case Channel.Project.v.ExtractFacesInProject:
            {
                const [_, channelName, folder] = args;
                return ExtractFacesInProject(folder,
                    (curCount: number, totalCount: number, faceCount: number, name: string) => {
                        // console.log(`emit ${channelName} ${count}`)
                        event.sender.send(channelName, curCount, totalCount, faceCount, name);
                    });
            }
            case Channel.Project.v.SaveConfig:
            {
                const [_, projectFolder, config] = args;
                return SaveConfig(projectFolder as string, config as ProjectType);
            }
            default:
                throw new Error(`unknown channel ${Channel.Project.k}:${args[0]} with args: ${args.slice(1)}`);
        }
    });

    ipcMain.handle(Channel.Edit.k, async (event, ...args) => {
        switch (args[0]) {
            case Channel.Edit.v.GetProjectFrameFaces:
            {
                const [_, channelName, projectFolder] = args;
                return GetProjectFrameFaces(projectFolder as string,
                    (cur: number, total: number) => {
                        event.sender.send(channelName, cur, total);
                    });
            }
            case Channel.Edit.v.GetImageSize:
            {
                const [_, imagePath] = args;
                return GetImageSize(imagePath as string);
            }
            case Channel.Edit.v.GetAllFacesInFaceLib:
            {
                const [_, projectFolder] = args;
                return GetAllFacesInFaceLib(projectFolder as string);
            }
            case Channel.Edit.v.SaveFaceLib:
            {
                const [_, projectFolder, face, file, alias] = args;
                return SaveFaceLib(projectFolder as string, face as Face, file as string, alias as string);
            }
            case Channel.Edit.v.UpdateFrameFaces:
            {
                const [_, channelName, projectFolder, bulkChanges] = args;
                return UpdateFrameFaces(projectFolder as string, bulkChanges as UpdateFrameFaceType[], (cur: number) => {
                    event.sender.send(channelName, cur);
                });
            }
            case Channel.Edit.v.GenerateProject:
            {
                const [_, channelName, projectFolder] = args;
                return GenerateProject(projectFolder as string, (cur: number, total: number, text: string) => {
                    event.sender.send(channelName, cur, total, text);
                });
            }
            case Channel.Edit.v.PreviewFrameSwap:
            {
                const [_, projectFolder, swap] = args;
                return PreviewFrameSwap(projectFolder as string, swap as FrameTypePreview);
            }
            default:
                throw new Error(`unknown channel ${Channel.Edit.k}:${args[0]} with args: ${args.slice(1)}`);
        }
    });

    ipcMain.handle(Channel.Util.k, async (event, ...args) => {
        switch (args[0]) {
            case Channel.Util.v.IdentifyFaces:
            {
                const [_, imagePath] = args;
                return IdentifyFaces(imagePath as string);
            }
            case Channel.Util.v.CloseDatabase:
            {
                const [_, projectFolder] = args;
                return Close(projectFolder as string);
            }
            default:
                throw new Error(`unknown channel ${Channel.Edit.k}:${args[0]} with args: ${args.slice(1)}`);
        }
    })
}
