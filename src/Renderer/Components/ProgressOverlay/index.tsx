import CircularProgress from '@mui/material/CircularProgress';
import { PropsWithChildren } from 'react';
import Style from './index.css';

import { useTheme } from '@mui/material/styles'

export default ({loading, height, children}: PropsWithChildren<{loading: boolean, height?: number | string}>) => {
    if(!loading) {
        return <>{children}</>;
    }

    const style = height? {height: typeof height === 'number'?`${height}px`: height}: {};

    const theme = useTheme();
    // console.log(theme.dim);

    return <div className={Style.relative} style={style}>
        {children}
        <div className={Style.overlay} style={{backgroundColor: theme.dim}}>
            <div className={Style.progress}>
                <CircularProgress size={60} thickness={3} classes={{root: Style.verticalPos}} />
            </div>
        </div>
    </div>
}
