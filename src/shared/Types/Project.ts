interface ProjectBase {
    referenceVideoFile: string,

    referenceVideoSlice: boolean,

    sourceVideoFile: string,
}



export interface ProjectEdit extends ProjectBase {
    referenceVideoFrom: string,
    referenceVideoTo: string,
}


export default interface Project extends ProjectBase {
    referenceVideoFrom: number | null,
    referenceVideoDuration: number | null,
}
