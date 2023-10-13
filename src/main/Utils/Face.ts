import Face from '~s/Types/Face';
import {WrapperHost} from './Config';

export const IdentifyFaces = (imagePath: string): Promise<Face[]> => {

    const url = `http://${WrapperHost}/identify_faces?file=${encodeURIComponent(imagePath)}`;

    return fetch(url)
            .then(resp => resp.json() as Promise<Face[]>);
}
