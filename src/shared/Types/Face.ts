type NArrayType = "float32";


interface NArray {
    readonly type: NArrayType;
    readonly value: number[];
}


export default interface Face {
    readonly bbox: NArray;
    readonly kps: NArray;
    readonly det_score: number;  // float
    readonly embeddings: NArray;
    readonly landmark_3d_68: NArray;
    readonly pose: NArray;
    readonly landmark_2d_106: NArray;
    readonly gender: 0 | 1;
    readonly age: number;  // int
    readonly embedding: NArray;
}
