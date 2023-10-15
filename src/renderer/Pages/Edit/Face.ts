import type Face from '~s/Types/Face';
import { Rect } from '~s/Face';
// import mathjs from 'mathjs';


export const RectScale = (rect: Rect, scale: number): Rect => ({
    top: rect.top * scale,
    left: rect.left * scale,
    bottom: rect.bottom * scale,
    right: rect.right * scale,
});
