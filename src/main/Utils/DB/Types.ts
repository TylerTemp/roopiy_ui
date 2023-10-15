
export interface FrameType {
    filePath: string,
    width: number,
    height: number,
    swappedToPath: string | null,
}


export interface FrameFaceType {
    id: number,
    value: string,
    groupId: number,
    faceLibId: number | null,
    frameFilePath: string,
}


// id INTEGER PRIMARY KEY AUTOINCREMENT,
// value TEXT NOT NULL,
// file TEXT NOT NULL,
// alias TEXT NOT NULL,
// hide BOOLEAN NOT NULL DEFAULT FALSE
export interface FaceLibType {
    id: number,
    value: string,
    file: string,
    fullFile: string,
    alias: string,
    hide: number,
}
