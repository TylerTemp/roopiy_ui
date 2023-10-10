import type { IpcMain } from 'electron';
import { Channels } from './preload';
import { GetList, CreateConfig, GetConfig } from './Project';
import ProjectType from '~s/Types/Project';

export default (ipcMain: IpcMain): void => {

    ipcMain.handle('project', async (event, ...args) => {
        if(args[0] === 'GetList') {
            return GetList();
        }
        else if(args[0] == 'GetConfig') {
            return GetConfig(args[1]);
        }
        else if(args[0] == 'CreateConfig') {
            return await CreateConfig(args[1], JSON.parse(args[2]) as ProjectType);
        }
    });

}