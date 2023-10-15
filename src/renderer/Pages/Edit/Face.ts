import { Rect } from '~s/Face';
import { FrameFaces } from '~s/Types/Edit';
// import mathjs from 'mathjs';


export const RectScale = (rect: Rect, scale: number): Rect => ({
    top: rect.top * scale,
    left: rect.left * scale,
    bottom: rect.bottom * scale,
    right: rect.right * scale,
});

export interface FrameFacesEdited extends FrameFaces {
    edited: boolean;
    // faces: FrameFaceEdited[];
}
