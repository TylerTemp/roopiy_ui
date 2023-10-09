import { contextBridge } from 'electron';

export const electronAPI = {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron
    // we can also expose variables, not just functions
};


// process.once("loaded", () => {
//     contextBridge.exposeInMainWorld('electronAPI', electronAPI);
// });

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
