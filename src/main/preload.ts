// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import ProjectType from '~s/Types/Project';
import Channel from './IpcChannel';

const electronHandler = {
    ipcRenderer: {
        // send(channel: Channels, ...args: unknown[]) {
        //     ipcRenderer.send(channel, ...args);
        // },
        // on(channel: Channels, func: (...args: unknown[]) => void) {
        //     const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        //         func(...args);
        //     ipcRenderer.on(channel, subscription);

        //     return () => {
        //         ipcRenderer.removeListener(channel, subscription);
        //     };
        // },
        // once(channel: Channels, func: (...args: unknown[]) => void) {
        //     ipcRenderer.once(channel, (_event, ...args) => func(...args));
        // },

        // invoke(channel: Channels, ...args: unknown[]) {
        //     return ipcRenderer.invoke(channel, ...args);
        // },

        project: {
            GetList: () => ipcRenderer.invoke(Channel.project.k, Channel.project.v.GetList) as Promise<string[]>,
            GetConfig: (name: string): Promise<ProjectType> => {
                const result = ipcRenderer.invoke(Channel.project.k, Channel.project.v.GetConfig, name);
                console.assert(result !== null);
                return result as Promise<ProjectType>;
            },

            GetVideoSeconds: (videoFile: string): Promise<number> => {
                console.log(`invoke`, Channel.project.k, Channel.project.v.GetVideoSeconds, videoFile);
                return ipcRenderer.invoke(Channel.project.k, Channel.project.v.GetVideoSeconds, videoFile) as Promise<number>;
            },
            // OnFolderImageCount: (folder: string, callback: (count:number) => void): (() => void) => {
            //     const channelName = `${Channel.project.v.OnFolderImageCountChannel}.${folder}`;

            //     ipcRenderer.on(channelName, (_event: IpcRendererEvent, count: number) => {
            //         callback(count);
            //     });
            //     ipcRenderer.send(Channel.project.k, Channel.project.v.OnFolderImageCount, folder);
            //     return () => {
            //         ipcRenderer.removeListener(channelName, callback);
            //     };
            // }
            ExtractVideo: (folder: string, config: ProjectType, callback: (count:number) => void): Promise<void> => {
                const channelName = `${Channel.project.v.ExtractVideoEvent}.${folder}`;

                console.log(`setup channel ${channelName}`)
                ipcRenderer.on(channelName, (_event: IpcRendererEvent, count: number, end: boolean) => {
                    callback(count);
                });

                return ipcRenderer.invoke(Channel.project.k, Channel.project.v.ExtractVideo,
                    channelName,
                    folder,
                    JSON.stringify(config))
                .then(() => ipcRenderer.removeListener(channelName, callback)) as Promise<void>;
            },

            ExtractFacesInProject: (projectFolder: string, callback: (curCount: number, totalCount: number, faceCount: number, name: string) => void): Promise<void> => {
                const channelName = `${Channel.project.v.ExtractFacesInProjectEvent}.${projectFolder}`;
                console.log(`setup channel ${channelName}`);
                ipcRenderer.on(channelName, (_event: IpcRendererEvent, curCount: number, totalCount: number, faceCount: number, name: string) => {
                    callback(curCount, totalCount, faceCount, name);
                });

                return ipcRenderer.invoke(Channel.project.k, Channel.project.v.ExtractFacesInProject,
                        channelName,
                        projectFolder)
                    .then(() => ipcRenderer.removeListener(channelName, callback)) as Promise<void>;
            },

            SaveConfig: (projectFolder: string, config: ProjectType) => ipcRenderer.invoke(Channel.project.k, Channel.project.v.SaveConfig, projectFolder, config) as Promise<void>,

            // CreateConfig: (name: string, config: ProjectType) => ipcRenderer.invoke('project', 'CreateConfig', name, JSON.stringify(config)) as Promise<void>,
        }
    },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
