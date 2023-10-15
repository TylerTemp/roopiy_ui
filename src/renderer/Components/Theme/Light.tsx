import { lime, blue, red, purple, teal, orange } from "@mui/material/colors";
import { createTheme } from "./Basic";

export default createTheme({
    typography: {
        button: {
            textTransform: 'none',
        },
    },

    palette: {
        mode: 'light'
    },
    colorPlattes: [
        blue[500], red[500], purple[500], teal[500], lime[500], orange[500]
    ],

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
