import type Face from '~s/Types/Face';
// import mathjs from 'mathjs';

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


export interface Rect {
    top: number,
    left: number,
    bottom: number,
    right: number,
}


export const GetRectFromFace = (face: Face): Rect => {
    const bbox = face.bbox.value;
    const result: Rect = {
        top: bbox[0],
        left: bbox[1],
        bottom: bbox[2],
        right: bbox[3],
    }
    return result;
}


export const RectDistance = (rect1: Rect, rect2: Rect): number => {
    const center1 = {
        x: (rect1.left + rect1.right) / 2,
        y: (rect1.top + rect1.bottom) / 2,
    };
    const center2 = {
        x: (rect2.left + rect2.right) / 2,
        y: (rect2.top + rect2.bottom) / 2,
    };

    const result = Math.sqrt((center1.x - center2.x)**2 + (center1.y - center2.y)**2);
    return result;
}
