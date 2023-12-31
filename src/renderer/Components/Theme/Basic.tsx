import React from "react";

export { createTheme } from "@mui/material/styles";
// export { ThemeProvider } from "@mui/material/styles";
// export { CssBaseline } from "@mui/material";

export type CssColorMust = Exclude<React.CSSProperties['color'], undefined>;

declare module '@mui/material/styles' {
    interface Theme {
      dim: React.CSSProperties['color']
      colorPlattes: [
        CssColorMust,
        CssColorMust,
        CssColorMust,
        CssColorMust,
        CssColorMust,
        CssColorMust,
      ]
      // status: {
      //   themeBubble: React.CSSProperties['color'];
      // },
      nav: {
        active: React.CSSProperties['color']
      }
      sortButton: {
        active: React.CSSProperties['color']
        fade: React.CSSProperties['color']
      }
      sepDevider: React.CSSProperties['color']
      buttonMockHoverBackgroundColor: React.CSSProperties['color']
    }
    // allow configuration using `createTheme`
    interface ThemeOptions {
      dim: React.CSSProperties['color']
      colorPlattes: [
        CssColorMust,
        CssColorMust,
        CssColorMust,
        CssColorMust,
        CssColorMust,
        CssColorMust,
      ]
      // status: {
      //   themeBubble: React.CSSProperties['color'];
      // },
      nav: {
        active: React.CSSProperties['color']
      }
      sortButton: {
        active: React.CSSProperties['color']
        fade: React.CSSProperties['color']
      }
      sepDevider: React.CSSProperties['color']
      buttonMockHoverBackgroundColor: React.CSSProperties['color']
    }
  }

// const theme = createTheme({
//     palette: {
//         mode: 'dark'
//     },
//     status: {
//         dim: 'red'
//     }
// });

// export createTheme;

// export default {
//     createTheme,
//     ThemeProvider,
//     CssBaseline,
// };
