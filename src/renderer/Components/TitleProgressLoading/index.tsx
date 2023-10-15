import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import useTheme from "@mui/material/styles/useTheme";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import Style from "./index.scss";

export interface TitleProgressLoadingProps {
    loading: boolean;
    loadingText: string | null;
    loadingProgress: number;
}

export default ({loading, loadingText, loadingProgress}: TitleProgressLoadingProps) =>  {
    const theme = useTheme();
    return <Box className={Style.overlay} sx={{ display: loading ? undefined : 'none', background: theme.dim }}>
        {loadingText && <Typography variant="caption">{loadingText}</Typography>}
        {loadingProgress < 0
            ? <CircularProgress />
            : <LinearProgress variant="determinate" value={loadingProgress * 100} className={Style.progress} />}
    </Box>;
}
