import Face from '~s/Types/Face';
import roopiy from './Roopiy';

export const IdentifyFaces = (imagePath: string): Promise<Face[]> => {

    // const url = `http://${WrapperHost}/identify_faces?file=${encodeURIComponent(imagePath)}`;

    // return fetch(url)
    //         .then(resp => resp.json() as Promise<Face[]>);
    // const resultString = ;
    // return Promise.resolve(JSON.parse(resultString) as Face[]);
    return roopiy.Send(JSON.stringify({
        'method': 'identify_faces',
        'payload': imagePath,
    }))
        .then(resp => JSON.parse(resp) as Face[]);
}
