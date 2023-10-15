import Box from "@mui/material/Box";
import useTheme from "@mui/material/styles/useTheme";
import Style from "./index.scss";

interface Props {
    src: string,
    alt: string,
    hidden: boolean,
    setHide: () => void,
}

export default ({src, alt, hidden, setHide}: Props) => {
    const theme = useTheme();
    if(hidden) {
        return <></>;
    }

    return <Box onClick={setHide} className={Style.container} style={{backgroundColor: theme.dim}}>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
        <img src={src} alt={alt} onClick={setHide} className={Style.image}/>
    </Box>
}