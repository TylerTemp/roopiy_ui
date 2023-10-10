import { useEffect, useRef } from "react";

// interface MakeProps<T> {
//     markPromise: () => Promise<T>;
//     key: string;
// }

interface CacheMap<T> {
    [key: string]: Promise<T>;
}

export type GetPromise<T> = (key: string, markPromise: () => Promise<T>) => Promise<T>;

// interface Props<T> {
//     initCache?: CacheMap<T>;
// }

export default <T>(initCache? : CacheMap<T>) => {
    const cacheRef = useRef<CacheMap<T>>(initCache || {});

    const cleanCache = () => {
        cacheRef.current = {};
    };

    useEffect(() => {
        return cleanCache;
    }, []);

    const addCache = (key: string, value: T) => {
        cacheRef.current[key] = Promise.resolve(value);
    }

    const getPromise: GetPromise<T> = (key: string, markPromise: () => Promise<T>) => {
        if(cacheRef.current[key] !== undefined) {
            return cacheRef.current[key];
        }

        const promise = markPromise();
        cacheRef.current[key] = promise;
        promise.catch(error => {
            delete cacheRef.current[key];
            throw error;
        });
        return promise;
    }

    return {
        getPromise,
        addCache,
        cleanCache
    }
}
