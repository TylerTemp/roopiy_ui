import { createTheme } from "./Basic";
import { blue } from "@mui/material/colors";

export default createTheme({
    typography: {
        button: {
            textTransform: 'none',
        },
    },

    palette: {
        mode: 'dark'
    },
    dim: 'rgba(255, 255, 255, 0.2)',
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
