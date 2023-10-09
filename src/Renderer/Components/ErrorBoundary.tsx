import React from 'react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Typography from '@mui/material/Typography';

interface ErrorBoundaryProps {
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

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryStates> {
    state: ErrorBoundaryStates = {
        error: undefined,
        info: {
            componentStack: '',
        },
    };

    componentDidCatch(error: Error | null, info: object) {
        this.setState({ error, info });
    }

    componentWillUnmount() {
        this.state = {}
    }

    render() {
        const { message, description, children } = this.props;
        const { error, info } = this.state;
        const componentStack = info && info.componentStack ? info.componentStack : null;
        const errorMessage = typeof message === 'undefined' ? (error || '').toString() : message;
        const errorDescription = typeof description === 'undefined' ? componentStack : description;
        if (error) {
            return <Alert severity="error">
                <AlertTitle>{errorMessage}</AlertTitle>
                <Typography variant="body1" component="div">
                    <pre style={{ fontSize: '0.9em', overflowX: 'auto' }}>{errorDescription}</pre>
                </Typography>
            </Alert>;
        }
        return children;
    }
}

export default ErrorBoundary;
