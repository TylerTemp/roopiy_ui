import type Face from '~s/Types/Face';
import { FrameFace } from './Types/Edit';


export interface Rect {
    top: number,
    left: number,
    bottom: number,
    right: number,
}


export interface Vector2 {
    x: number,
    y: number,
}


export const GetRectFromFace = (face: Face): Rect => {
    const bbox = face.bbox.value;
    const result: Rect = {
        top: bbox[1],
        left: bbox[0],
        bottom: bbox[3],
        right: bbox[2],
    }
    return result;
}

export const Similar = (face1: Face, face2: Face): number => {
    // Define your vectors as arrays
    const vec1 = face1.embedding.value; // Example vector 1
    const vec2 = face2.embedding.value; // Example vector 2

    // Calculate the L2 norms of both vectors
    const normedEmbedding1 = vec1.map(value => value / Math.sqrt(vec1.reduce((acc, val) => acc + val * val, 0)));
    const normedEmbedding2 = vec2.map(value => value / Math.sqrt(vec2.reduce((acc, val) => acc + val * val, 0)));

    // Calculate the squared differences
    const squaredDifferences = normedEmbedding1.map((value, index) => (value - normedEmbedding2[index])**2);

    // Sum up the squared differences
    const result = squaredDifferences.reduce((acc, value) => acc + value, 0);

    // console.log('Result:', result);

    return result;
}


export const RectCenterDirection = (rectFrom: Rect, rectTo: Rect): Vector2 => {
    const center1 = {
        x: (rectFrom.left + rectFrom.right) / 2,
        y: (rectFrom.top + rectFrom.bottom) / 2,
    };
    const center2 = {
        x: (rectTo.left + rectTo.right) / 2,
        y: (rectTo.top + rectTo.bottom) / 2,
    };

    return {
        x: center2.x - center1.x,
        y: center2.y - center1.y
    };

    // const result = Math.sqrt((center1.x - center2.x)**2 + (center1.y - center2.y)**2);
    // return result;
}

export const RectCenterDistance = (rect1: Rect, rect2: Rect): number => {
    const {x, y} = RectCenterDirection(rect1, rect2);
    return Math.sqrt(x ** 2 +  y ** 2);
}


interface FaceSimilarInfo {
    oriFace: Face,
    similar: number
}

export interface FaceSimilar {
    targetFace: Face,
    similars: FaceSimilarInfo[]
}


export const FacesSimilars = (oriFaces: Face[], checkFaces: Face[]): FaceSimilar[] => checkFaces
    .map((targetFace: Face): FaceSimilar => {
        const similars: FaceSimilarInfo[] = oriFaces
            .map((oriFace: Face): FaceSimilarInfo => ({
                oriFace,
                similar: Similar(targetFace, oriFace)
            }));

        similars.sort(({ similar: similar1 }, { similar: similar2 }) => similar2 - similar1);

        return ({
            targetFace,
            similars,
        });
    });

interface FaceDistanceInfo {
    oriFace: FrameFace,
    distance: number
}


export interface FaceDistance {
    targetFace: FrameFace,
    distances: FaceDistanceInfo[]
}


export const FacesDistances = (oriFaces: FrameFace[], checkFaces: FrameFace[]): FaceDistance[] => checkFaces
    .map((targetFace: FrameFace): FaceDistance => {
        const distances: FaceDistanceInfo[] = oriFaces
            .map((oriFace: FrameFace): FaceDistanceInfo => ({
                oriFace,
                distance: RectCenterDistance(GetRectFromFace(targetFace.face), GetRectFromFace(oriFace.face))
            }));
        // const similars: FaceSimilarInfo[] = oriFaces
        //     .map((oriFace: Face): FaceSimilarInfo => ({
        //         oriFace,
        //         similar: Similar(targetFace, oriFace)
        //     }));

        distances.sort(({ distance: distance1 }, { distance: distance2 }) => distance1 - distance2);
        // similars.sort(({ similar: similar1 }, { similar: similar2 }) => similar2 - similar1);

        return ({
            targetFace,
            distances,
        });
    })
    .sort(({ distances: [aFirstDistanceInfo] }, { distances: [bFirstDistanceInfo] }) => {
        if(aFirstDistanceInfo === undefined || bFirstDistanceInfo === undefined) {
            return Number.MAX_SAFE_INTEGER;
        }
        return aFirstDistanceInfo.distance - bFirstDistanceInfo.distance;
    });
