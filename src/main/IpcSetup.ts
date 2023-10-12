import type { IpcMain } from 'electron';
import ProjectType from '~s/Types/Project';
import Channel from './IpcChannel';
import { GetList, ExtractVideo, GetConfig, GetVideoSeconds, ExtractFacesInProject, SaveConfig } from './Project';

export default (ipcMain: IpcMain): void => {

    ipcMain.handle(Channel.project.k, async (event, ...args) => {
        if(args[0] === Channel.project.v.GetList) {
            return GetList();
        }
        if(args[0] === Channel.project.v.GetConfig) {
            return GetConfig(args[1]);
        }
        if(args[0] === Channel.project.v.GetVideoSeconds) {
            return GetVideoSeconds(args[1]);
        }
        if(args[0] === Channel.project.v.ExtractVideo) {
            const [_, channelName, folder, projectTypeStr] = args;
            const result: Promise<void> = ExtractVideo(folder,
                JSON.parse(projectTypeStr) as ProjectType,
                (count: number) => {
                    // console.log(`emit ${channelName} ${count}`)
                    event.sender.send(channelName, count);
                });
            return result;
        }
        if(args[0] === Channel.project.v.ExtractFacesInProject) {
            const [_, channelName, folder] = args;
            return ExtractFacesInProject(folder,
                (curCount: number, totalCount: number, faceCount: number, name: string) => {
                    // console.log(`emit ${channelName} ${count}`)
                    event.sender.send(channelName, curCount, totalCount, faceCount, name);
                });
        }
        if(args[0] === Channel.project.v.SaveConfig) {
            const [_, projectFolder, config] = args;
            return SaveConfig(projectFolder as string, config as ProjectType);
        }
    });

}
