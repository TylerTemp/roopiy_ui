import type { IpcMain } from 'electron';
import { Channels } from './preload';
import { GetList } from './Project';

export default (ipcMain: IpcMain): void => {

    ipcMain.handle('project', (event, ...args): any => {
        if(args[0] === 'list') {
            return GetList();
        }
    });

}