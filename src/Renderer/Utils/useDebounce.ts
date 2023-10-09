import { useEffect, useState } from "react";

export interface DebounceResult {
    debouncing: boolean,
    startDebounce: (callback: () => void) => void,
    cancelDebounce: () => void,
}

export default (durationMS: number): DebounceResult => {
    const [debounce, setDebounce] = useState<NodeJS.Timeout | null>(null);
    const [debouncing, setDebouncing] = useState<boolean>(false);

    const cancelDebounce = (): void => {
        debounce !== null && clearTimeout(debounce);
    };
    const startDebounce = (callback: () => void) => setDebounce(oldTimeout => {
        if (oldTimeout !== null) {
            clearTimeout(oldTimeout);
        }
        setDebouncing(true);
        return setTimeout(() => {
            callback();
            setDebouncing(false);
        }, durationMS);
    });

    useEffect(() => cancelDebounce, []);

    return {
        debouncing,
        startDebounce,
        cancelDebounce,
    };
}