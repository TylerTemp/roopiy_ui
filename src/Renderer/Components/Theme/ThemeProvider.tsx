import { PropsWithChildren, createContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
// import { Theme } from "@mui/material/styles/createTheme";

import Dark from "./Dark";
import Light from "./Light";
// import Context, { ThemeType } from "./Context";

const getTheme = (themeType: ThemeType) => {
    switch(themeType) {
        case ThemeType.Dark:
            return Dark;
        case ThemeType.Light:
            return Light;
        default:
            throw new Error(`Unknown theme ${themeType}`);
    }
}

export enum ThemeType {
    Dark,
    Light
}
// export default createContext({
//     setSelected: (selectedInfo: Theme): void => {},
// });

interface ContextInfo {
    theme: ThemeType,
    setTheme: (themeType: ThemeType) => void,
}

export const Context = createContext<ContextInfo>({
    theme: ThemeType.Dark,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setTheme: (themeType: ThemeType): void => {
        // init context
    }
});

// export const Context = createContext(getTheme(ThemeType.Dark));

export default ({children}: PropsWithChildren) => {
    const [theme, setTheme] = useState<ThemeType>(localStorage.getItem("theme") === null? ThemeType.Dark: ThemeType[localStorage.getItem("theme") as keyof typeof ThemeType]);

    const themeResult = useMemo(() => getTheme(theme), [theme]);
    useEffect(() => {
        localStorage.setItem("theme", ThemeType[theme]);
    }, [theme]);

    return <Context.Provider value={{
        theme,
        setTheme: newValue => setTheme(newValue),
    }}>
        <ThemeProvider theme={themeResult}>
            {children}
        </ThemeProvider>
    </Context.Provider>;
}