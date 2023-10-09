import { PropsWithChildren } from 'react';
import Style from './index.css';

import { useTheme } from '@mui/material/styles'
import LinearProgress from '@mui/material/LinearProgress';

export default ({loading, height, children}: PropsWithChildren<{loading: boolean, height?: number | string}>) => {
    if(!loading) {
        return <>{children}</>;
    }

    const style = height? {height: typeof height === 'number'?`${height}px`: height}: {};

    const theme = useTheme();
    // console.log(theme.status.dim);
    // theme.components?.MuiDivider?.styleOverrides.

    return <div className={Style.relative} style={style}>
        {children}
        <div className={Style.overlay} style={{backgroundColor: theme.dim}}>
            <LinearProgress classes={{root: Style.verticalPos}} />
        </div>
    </div>
}
