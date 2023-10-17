import useTheme from "@mui/material/styles/useTheme";
import { CssColorMust } from "~/Components/Theme/Basic";

const PickColorByNumber = (num: number, colors: CssColorMust[]): CssColorMust => colors[num % colors.length];

export default (num: number) => {
    const {colorPlattes} = useTheme();
    return PickColorByNumber(num, colorPlattes);
}
