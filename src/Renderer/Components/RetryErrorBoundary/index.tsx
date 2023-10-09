import AlertTitle from '@mui/material/AlertTitle';
import Typography from '@mui/material/Typography';

import React from "react";
import AlertSimple from '~/Components/AlertSimple';

export interface ErrorBoundaryProps {
    onRetry: () => void,
    noTrace?: boolean,
    message?: React.ReactNode;
    description?: React.ReactNode;
    children?: React.ReactNode;
}

interface ErrorBoundaryStates {
    error?: Error | null;
    info?: {
        componentStack?: string;
    };
}

export default class RetryErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryStates> {
    state: ErrorBoundaryStates = {};

    componentDidCatch(error: Error | null, info: object) {
        this.setState({ error, info });
    }

    componentWillUnmount() {
        this.state = {}
    }

    render() {
        const { message, description, children, onRetry, noTrace } = this.props;
        const { error, info } = this.state;
        const componentStack = info && info.componentStack ? info.componentStack : null;
        const errorMessage = typeof message === 'undefined' ? (error || '').toString() : message;
        const errorDescription = typeof description === 'undefined' ? componentStack : description;
        if (error) {
            return <AlertSimple
                severity="error"
                onReload={() => {
                    this.setState({});
                    onRetry();
                }}
            >
                <AlertTitle>{errorMessage}</AlertTitle>
                {noTrace || <Typography variant="body1" component="div">
                    <pre style={{ fontSize: '0.9em', overflowX: 'auto' }}>{errorDescription}</pre>
                </Typography>}
            </AlertSimple>;
        }
        return children;
    }
}
