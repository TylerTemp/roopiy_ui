import Select from "@mui/material/Select";
import MenuItem from '@mui/material/MenuItem';
import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { FacesDistances } from "~s/Face";
import { FrameFacesEdited } from "../Face";
import { FrameFace } from "~s/Types/Edit";
// import { FrameFacesEdited } from "..";

interface Props {
    frameFaces: FrameFacesEdited[];
    setFrameFaces: (callback: (frameFaces: FrameFacesEdited[]) => FrameFacesEdited[]) => void;
    selectedRange: [number, number];
    selectedFrameIndex: number;
}


const GroupSwitch = ({}: Pick<Props, "frameFaces" | "setFrameFaces" | "selectedRange">) => {

}


type ApplyTarget = "all" | "selected" | "range";

export default ({frameFaces, setFrameFaces, selectedRange: [startRange, endRange], selectedFrameIndex}: Props) => {

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
        let {faces: prevFaces} = first;

        const allGroupIds = new Set(oldFaces.map(({faces}) => faces.map(({groupId}) => groupId)).flat());

        const restFaces = rest.map((eachFrameFaces): FrameFacesEdited => {
            const {faces: curFaces, ...leftFrameArgs} = eachFrameFaces;
            const distanceResults = FacesDistances(prevFaces, curFaces);
            console.log(distanceResults);
            const newTagetFaces: FrameFace[] = []
            const takenGroupIds = new Set();
            const availableGroupIds = new Set(allGroupIds);
            let edited = false;
            distanceResults.forEach(({targetFace, distances}) => {
                const [closest] = distances.filter(({distance, oriFace: {groupId}}) => distance < positionDistance && !takenGroupIds.has(groupId));
                if(closest === undefined) {
                    // newTagetFace.push(targetFace);  // no change
                    if(takenGroupIds.has(targetFace.groupId)) {
                        // availableGroupIds.delete(targetFace.groupId);
                        // targetFace.groupId = [...availableGroupIds][0];
                        const [useId] = availableGroupIds;
                        // console.log(`no match, ${targetFace.id} targetFace.groupId ${targetFace.groupId} taken, use a random ${useId}`);
                        targetFace.groupId = useId;
                        edited = true;
                    }
                    else {
                        // console.log(`no match, ${targetFace.id} targetFace.groupId ${targetFace.groupId} not taken, use same`);
                    }
                }
                else {  //
                    console.assert(!takenGroupIds.has(closest.oriFace.groupId));
                    // console.log(`match, ${targetFace.id} targetFace.groupId ${targetFace.groupId} to ${closest.oriFace.groupId} (${closest.oriFace.id})`);
                    if(targetFace.groupId !== closest.oriFace.groupId) {
                        targetFace.groupId = closest.oriFace.groupId;
                        edited = true;
                    }
                }

                takenGroupIds.add(targetFace.groupId);
                availableGroupIds.delete(targetFace.groupId);
                newTagetFaces.push(targetFace);
            })
            prevFaces = newTagetFaces;

            return {...leftFrameArgs, edited, faces: newTagetFaces};
        });

        console.log(`updated frame faces`);
        return [...preFaces, first, ...restFaces, ...postFaces];
    })

    const allGroupIds = useMemo(() => new Set(frameFaces.map(({faces}) => faces.map(({groupId}) => groupId)).flat()), [frameFaces]);

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