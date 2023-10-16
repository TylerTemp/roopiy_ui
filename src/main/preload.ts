// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import ProjectType from '~s/Types/Project';
import { FrameFaces } from '~s/Types/Edit';
import Face from '~s/Types/Face';
import { type UpdateFrameFaceType } from './Edit/Types';
import Channel from './IpcChannel';
import { ParsedFaceLibType } from './Edit/Types';
import { webFrame } from 'electron';

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
        WebFrame: {
            setZoomOffset: (zoomOffset: number) => webFrame.setZoomFactor(Math.max(0.00001, webFrame.getZoomFactor() + zoomOffset)),
        },

        Project: {
            GetList: () => ipcRenderer.invoke(Channel.Project.k, Channel.Project.v.GetList) as Promise<string[]>,
            GetConfig: (name: string): Promise<ProjectType> => {
                const result = ipcRenderer.invoke(Channel.Project.k, Channel.Project.v.GetConfig, name);
                console.assert(result !== null);
                return result as Promise<ProjectType>;
            },

            GetVideoSeconds: (videoFile: string): Promise<number> => {
                console.log(`invoke`, Channel.Project.k, Channel.Project.v.GetVideoSeconds, videoFile);
                return ipcRenderer.invoke(Channel.Project.k, Channel.Project.v.GetVideoSeconds, videoFile) as Promise<number>;
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
                const channelName = `${Channel.Project.v.ExtractVideoEvent}.${folder}`;

                console.log(`setup channel ${channelName}`)
                ipcRenderer.on(channelName, (_event: IpcRendererEvent, count: number, end: boolean) => {
                    callback(count);
                });

                return ipcRenderer.invoke(Channel.Project.k, Channel.Project.v.ExtractVideo,
                    channelName,
                    folder,
                    JSON.stringify(config))
                .then(() => ipcRenderer.removeListener(channelName, callback)) as Promise<void>;
            },

            ExtractFacesInProject: (projectFolder: string, callback: (curCount: number, totalCount: number, faceCount: number, name: string) => void): Promise<void> => {
                const channelName = `${Channel.Project.v.ExtractFacesInProjectEvent}.${projectFolder}`;
                console.log(`setup channel ${channelName}`);
                ipcRenderer.on(channelName, (_event: IpcRendererEvent, curCount: number, totalCount: number, faceCount: number, name: string) => {
                    callback(curCount, totalCount, faceCount, name);
                });

                return ipcRenderer.invoke(Channel.Project.k, Channel.Project.v.ExtractFacesInProject,
                        channelName,
                        projectFolder)
                    .then(() => ipcRenderer.removeListener(channelName, callback)) as Promise<void>;
            },

            SaveConfig: (projectFolder: string, config: ProjectType): Promise<void> => {
                const result = ipcRenderer.invoke(Channel.Project.k, Channel.Project.v.SaveConfig, projectFolder, config);
                console.assert(result !== null);
                return result as Promise<void>;
            },

            // CreateConfig: (name: string, config: ProjectType) => ipcRenderer.invoke('project', 'CreateConfig', name, JSON.stringify(config)) as Promise<void>,
        },
        Edit: {
            GetProjectFrameFaces: (projectFolder: string, callback: (cur: number, total: number) => void): Promise<FrameFaces[]> => {
                const channelName = `${Channel.Edit.v.GetProjectFrameFacesEvent}.${projectFolder}`;
                console.log(`setup channel ${channelName}`);
                ipcRenderer.on(channelName, (_event: IpcRendererEvent, cur: number, total: number) => {
                    callback(cur, total);
                });
                const result = ipcRenderer.invoke(Channel.Edit.k, Channel.Edit.v.GetProjectFrameFaces, channelName, projectFolder);
                console.assert(result !== null);
                return (result as Promise<FrameFaces[]>)
                    .then(r => {
                        ipcRenderer.removeListener(channelName, callback);
                        return r;
                    });
            },
            GetImageSize: (imagePath: string): Promise<{width: number, height: number}> => {
                const result = ipcRenderer.invoke(Channel.Edit.k, Channel.Edit.v.GetImageSize, imagePath);
                console.assert(result !== null);
                return result as Promise<{width: number, height: number}>;
            },
            GetAllFacesInFaceLib: (projectFolder: string): Promise<ParsedFaceLibType[]> => {
                const result = ipcRenderer.invoke(Channel.Edit.k, Channel.Edit.v.GetAllFacesInFaceLib, projectFolder);
                console.assert(result !== null);
                return result as Promise<ParsedFaceLibType[]>;
            },
            SaveFaceLib: (projectFolder: string, face: Face, file: string, alias: string): Promise<ParsedFaceLibType> => {
                const result = ipcRenderer.invoke(Channel.Edit.k, Channel.Edit.v.SaveFaceLib,
                    projectFolder, face, file, alias);
                console.assert(result !== null);
                return result as Promise<ParsedFaceLibType>;
            },
            UpdateFrameFaces: (projectFolder: string, bulkChanges: UpdateFrameFaceType[], callback: (cur: number) => void): Promise<void> => {
                const channelName = `${Channel.Edit.v.UpdateFrameFacesEvent}.${projectFolder}`;
                console.log(`setup channel ${channelName}`);
                ipcRenderer.on(channelName, (_event: IpcRendererEvent, cur: number) => {
                    callback(cur);
                });
                const result = ipcRenderer.invoke(Channel.Edit.k, Channel.Edit.v.UpdateFrameFaces,
                    channelName, projectFolder, bulkChanges);
                console.assert(result !== null);
                return (result as Promise<void>)
                    .then(() => {
                        ipcRenderer.removeListener(channelName, () => {});
                        // return r;
                    });
            },
        },

        Util: {
            IdentifyFaces: (imagePath: string): Promise<Face[]> => {
                return ipcRenderer.invoke(Channel.Util.k, Channel.Util.v.IdentifyFaces, imagePath) as Promise<Face[]>;
            },
        }
    },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
