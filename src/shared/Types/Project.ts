interface ProjectBase {
    referenceVideoFile: string,
    referenceVideoSlice: boolean,
    sourceVideoFile: string,

    sourceVideoExtracted: boolean,
    sourceVideoFaceIdentified: boolean,
}


export interface ProjectEdit extends ProjectBase {
    referenceVideoFrom: string,
    referenceVideoTo: string,
    sourceVideoToUse?: string | undefined,
}


export default interface Project extends ProjectBase {
    referenceVideoFrom: number | null,
    referenceVideoDuration: number | null,
    sourceVideoToUse: string,
    sourceVideoAbs: boolean,
}
