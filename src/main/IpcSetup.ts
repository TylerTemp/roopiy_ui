import type { IpcMain } from 'electron';
import Channel from './IpcChannel';
import { GetList, ExtractVideo, GetConfig, GetVideoSeconds } from './Project';
import ProjectType from '~s/Types/Project';

export default (ipcMain: IpcMain): void => {

    ipcMain.handle(Channel.project.k, async (event, ...args) => {
        if(args[0] === Channel.project.v.GetList) {
            return GetList();
        }
        else if(args[0] === Channel.project.v.GetConfig) {
            return GetConfig(args[1]);
        }
        else if(args[0] === Channel.project.v.GetVideoSeconds) {
            return GetVideoSeconds(args[1]);
        }
        // else if(args[0] == Channel.project.v.CreateConfig) {
        //     return await ExtractVideo(args[1], JSON.parse(args[2]) as ProjectType);
        // }
    });

}
