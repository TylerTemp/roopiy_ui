import { createTheme } from "./Basic";
import { lime, blue } from "@mui/material/colors";

export default createTheme({
    typography: {
        button: {
            textTransform: 'none',
        },
    },

    palette: {
        mode: 'light'
    },

    dim: '#24242482',
    // status: {
    //     themeBubble: yellow[400],
    // },
    nav: {
        active: lime[300],
    },
    sortButton: {
        active: blue[500],
        fade: 'white',
    },
    sepDevider: 'rgba(0, 0, 0, 0.12)',
    buttonMockHoverBackgroundColor: 'rgba(25, 118, 210, 0.04)',
});
