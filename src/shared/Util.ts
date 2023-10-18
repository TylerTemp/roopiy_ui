export const clamp = (num: number, min: number, max: number): number => Math.min(Math.max(num, min), max);

export const ParseFFmpegTime = (timeStr: string): number => {
    const floatPart: string = timeStr.includes('.') ? timeStr.split('.')[1] : '';
    let totalSeconds: number;

    const parts: string[] = timeStr.split(':');

    let hours: string | undefined;
    let minutes: string | undefined;
    let seconds: string | undefined;

    if (parts.length === 3) {
        [hours, minutes, seconds] = parts;
        totalSeconds = parseInt(hours, 10) * 3600 + parseInt(minutes, 10) * 60 + parseInt(seconds, 10);
    } else if (parts.length === 2) {
        [minutes, seconds] = parts;
        totalSeconds = parseInt(minutes, 10) * 60 + parseInt(seconds, 10);
    } else if (parts.length === 1) {
        totalSeconds = parseInt(parts[0], 10);
        console.log(`parsed: ${parts} -> ${totalSeconds}${floatPart}`);
    } else {
        throw new Error(`Invalid time string: ${timeStr}`);
    }

    console.assert(!Number.isNaN(totalSeconds), `totalSeconds is NaN: ${timeStr}`);
    const floatValue: number = (floatPart ? parseFloat(`0.${floatPart}`) : 0);
    console.assert(!Number.isNaN(floatValue), `floatValue is NaN: ${floatPart}`);

    return totalSeconds + floatValue;
};
