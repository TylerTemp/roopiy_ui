import { ReactNode, Suspense, useEffect, useState } from "react"
import Suspendable from "~/Utils/Suspendable";
import RetryErrorBoundary, { type ErrorBoundaryProps } from "~/Components/RetryErrorBoundary";

export interface RendererProps<T> {
    getResource: () => T
}

export type Props<T> = Omit<ErrorBoundaryProps, "onRetry"> & {
    // getResource: () => T,
    // promise: Promise<T>,
    makePromise: (abortController: AbortController) => Promise<T>,
    fallback: ReactNode,
    renderer: (props: RendererProps<T>) => ReactNode,
}

interface States<T> {
    abortController: AbortController,
    retryKey: number,
    getResource: () => T,
}

export default <T,>({makePromise, fallback, renderer: Renderer, noTrace}: Props<T>) => {
    const [states, setStates] = useState<States<T> | null>(null);

    const doRetry = () => {
        setStates(oldState => {
            oldState?.abortController.abort();

            const abortController = new AbortController();
            return {
                abortController,
                retryKey: oldState? (-oldState.retryKey): Math.random(),
                getResource: Suspendable(makePromise(abortController)),
            }
        });
    };

    useEffect(() => {
        doRetry();
    }, [makePromise]);

    useEffect(() => {
        return () => {
            console.log(`cleanup ${states?.retryKey}`);
            states?.abortController.abort();
        }
    }, []);

    if(states === null) {
        return fallback;
    }

    return <RetryErrorBoundary onRetry={doRetry} noTrace={noTrace} key={states.retryKey}>
        <Suspense fallback={fallback}>
            <Renderer
                getResource={states.getResource} />

        </Suspense>
    </RetryErrorBoundary>;
}