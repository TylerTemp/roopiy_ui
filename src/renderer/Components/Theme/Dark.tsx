import { blue, red, purple, teal, lime, orange } from "@mui/material/colors";
import { createTheme } from "./Basic";

export default createTheme({
    typography: {
        button: {
            textTransform: 'none',
        },
    },

    palette: {
        mode: 'dark'
    },
    dim: 'rgb(0 0 0 / 76%)',
    colorPlattes: [
        blue[500], red[500], purple[500], teal[500], lime[500], orange[500]
    ],
    // status: {
    //     themeBubble: grey[300],
    // },
    nav: {
        active: blue[300]
    },
    sortButton: {
        active: blue[200],
        fade: 'black',
    },
    sepDevider: 'rgba(255, 255, 255, 0.12)',
    buttonMockHoverBackgroundColor: 'rgba(144, 202, 249, 0.08)',
});
