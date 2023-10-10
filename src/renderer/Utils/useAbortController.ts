import { useEffect, useState } from "react";

export default() => {
    const [abortController, setAbortController] = useState<AbortController | null>(null);

    useEffect(() => {
        setAbortController(old => {
            old?.abort();
            return new AbortController();
        });

        return () => {
            if(abortController !== null) {
                abortController.abort();
            }
        };
    }, []);

    return (): AbortSignal => {
        const newAbortController = new AbortController();
        setAbortController(old => {
            old?.abort();
            return newAbortController;
        });
        return newAbortController.signal;
    };
}
