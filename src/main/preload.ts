// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import ProjectType from '~s/Types/Project';

export type Channels = 'project';

const electronHandler = {
    ipcRenderer: {
        send(channel: Channels, ...args: unknown[]) {
            ipcRenderer.send(channel, ...args);
        },
        on(channel: Channels, func: (...args: unknown[]) => void) {
            const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
                func(...args);
            ipcRenderer.on(channel, subscription);

            return () => {
                ipcRenderer.removeListener(channel, subscription);
            };
        },
        once(channel: Channels, func: (...args: unknown[]) => void) {
            ipcRenderer.once(channel, (_event, ...args) => func(...args));
        },

        invoke(channel: Channels, ...args: unknown[]) {
            return ipcRenderer.invoke(channel, ...args);
        },

        project: {
            GetList: () => ipcRenderer.invoke('project', 'GetList') as Promise<string[]>,
            GetConfig: (name: string) => ipcRenderer.invoke('project', 'GetConfig', name) as Promise<ProjectType>,
            CreateConfig: (name: string, config: ProjectType) => ipcRenderer.invoke('project', 'CreateConfig', name, JSON.stringify(config)) as Promise<void>,
        }
    },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
