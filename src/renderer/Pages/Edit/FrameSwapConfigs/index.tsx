import Select from "@mui/material/Select";
import { FrameFacesEdited } from "..";
import MenuItem from '@mui/material/MenuItem';
import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { FacesDistances } from "~s/Face";

interface Props {
    // frameFaces: FrameFacesEdited[];
    setFrameFaces: (callback: (frameFaces: FrameFacesEdited[]) => FrameFacesEdited[]) => void;
    selectedRange: [number, number];
    selectedFrameIndex: number;
}

type ApplyTarget = "all" | "selected" | "range";

export default ({setFrameFaces, selectedRange: [startRange, endRange], selectedFrameIndex}: Props) => {

    const [applyTarget, setApplyTarget] = useState<ApplyTarget>("range");
    // const [similar, setSimilar] = useState<number>(0.85);
    const [positionDistance, setPositionDistance] = useState<number>(0.5);

    const applyDistance = () => setFrameFaces((oldFaces: FrameFacesEdited[]): FrameFacesEdited[] => {
        let targetFaces: FrameFacesEdited[] = [];
        let preFaces: FrameFacesEdited[] = [];
        let postFaces: FrameFacesEdited[] = [];
        switch(applyTarget) {
            case "all":
                targetFaces = oldFaces;
                break;
            // case "selected":
            //     targetFaces = frameFaces.slice(selectedFrameIndex, selectedFrameIndex+1);
            //     break;
            case "range":
                targetFaces = oldFaces.slice(startRange, endRange+1);
                preFaces = oldFaces.slice(0, startRange);
                postFaces = oldFaces.slice(endRange+1);
                break;
            default:
                throw new Error(`Invalid applyTarget ${applyTarget}`);
        }

        const [first, ...rest] = targetFaces;
        const {faces: prevFaces} = first;
        const restFaces = rest.map((eachFrameFaces) => {
            const {faces: curFaces} = eachFrameFaces;
            const distanceResults = FacesDistances(prevFaces, curFaces);
            console.log(distanceResults);
            return eachFrameFaces;
        });

        return [...preFaces, first, ...restFaces, ...postFaces];
    })

    return <>
        <Select
            value={applyTarget}
            label="Apply Target"
            onChange={(event) => setApplyTarget(event.target.value as ApplyTarget)}
        >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="selected">Selected</MenuItem>
            <MenuItem value="range">Range</MenuItem>
        </Select>

        <Box>
            <TextField
                inputProps={{inputMode: 'numeric'}}
                label="Max Distance"
                value={positionDistance}
                onChange={(event) => setPositionDistance(parseFloat(event.target.value))}
            />
            <Button onClick={applyDistance} disabled={applyTarget === "selected"}>Apply</Button>
        </Box>
    </>;
}