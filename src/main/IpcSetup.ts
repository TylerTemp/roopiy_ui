import type { IpcMain } from 'electron';
import ProjectType from '~s/Types/Project';
import Channel from './IpcChannel';
import { GetList, ExtractVideo, GetConfig, GetVideoSeconds, ExtractFacesInProject, SaveConfig } from './Project';
import { GetProjectFrameFaces } from './Edit';

export default (ipcMain: IpcMain): void => {

    ipcMain.handle(Channel.Project.k, async (event, ...args) => {
        switch (args[0]) {
            case Channel.Project.v.GetList:
                return GetList();
            case Channel.Project.v.GetConfig:
                return GetConfig(args[1]);
            case Channel.Project.v.GetVideoSeconds:
                return GetVideoSeconds(args[1]);
            case Channel.Project.v.ExtractVideo:
            {
                const [_, channelName, folder, projectTypeStr] = args;
                const result: Promise<void> = ExtractVideo(folder,
                    JSON.parse(projectTypeStr) as ProjectType,
                    (count: number) => {
                        // console.log(`emit ${channelName} ${count}`)
                        event.sender.send(channelName, count);
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
                const [_, projectFolder] = args;
                return GetProjectFrameFaces(projectFolder as string);
            }
            default:
                throw new Error(`unknown channel ${Channel.Edit.k}:${args[0]} with args: ${args.slice(1)}`);
        }
    });
}
