
import Face from '~s/Types/Face';
import { FaceLibType, type FrameFaceType} from '../Utils/DB/Types';

export type UpdateFrameFaceType = Pick<FrameFaceType, "id"> & Partial<Pick<FrameFaceType, "groupId" | "faceLibId">>;
export interface ParsedFaceLibType extends Omit<FaceLibType, "value" | "hide"> {
    face: Face,
    hide: boolean,
}
