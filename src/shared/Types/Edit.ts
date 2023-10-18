import Face from "./Face";

export interface FrameFace {
    id: number,
    face: Face,
    groupId: number,
    faceLibId: number | null,
}

export interface FrameFaces {
    filePath: string,
    faces: FrameFace[],
    width: number,
    height: number,
    swappedToPath: string | null,
}
