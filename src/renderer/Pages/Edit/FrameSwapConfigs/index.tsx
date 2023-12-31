import Select from "@mui/material/Select";
import MenuItem from '@mui/material/MenuItem';
import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { FacesDistances } from "~s/Face";
import { FrameFace } from "~s/Types/Edit";
import Stack from "@mui/material/Stack";
import { FrameFacesEdited } from "../Face";
import SwapGroupIds, { type NumberKV } from "./SwapGroupIds";
import SwapFaceIds from "./SwapFaceIds";
import { FaceLibType } from "../FaceLib";


interface Props {
    projectFolder: string,
    frameFaces: FrameFacesEdited[];
    faceLibFaces: FaceLibType[];
    setFrameFaces: (callback: (frameFaces: FrameFacesEdited[]) => FrameFacesEdited[]) => void;
    selectedRange: [number, number];
    selectedFrameIndex: number;
}


const GroupSwitch = ({}: Pick<Props, "frameFaces" | "setFrameFaces" | "selectedRange">) => {

}


type ApplyTarget = "All" | "Range" | "Group" | "Frame";


const FindGroupStartIndex = (frameFaces: Props["frameFaces"], selectedFrameIndex: number, selectedGroupId: number): number => frameFaces
    .slice(0, selectedFrameIndex+1)
    .map(({faces}, index) => ({faces, index}))
    .reverse()
    .find(({faces}) => faces.every(({groupId}) => groupId !== selectedGroupId))
    ?.index ?? 0;

const FindGroupEndIndex = (frameFaces: Props["frameFaces"], selectedFrameIndex: number, selectedGroupId: number): number => frameFaces
    .map(({faces}, index) => ({faces, index}))
    .slice(selectedFrameIndex+1)
    .find(({faces}) => faces.every(({groupId}) => groupId !== selectedGroupId))
    ?.index ?? (frameFaces.length - 1);

const CutFrameFacesArray = (frameFaces: Props["frameFaces"], selectedRange: Props["selectedRange"], selectedFrameIndex: number, selectedFaceIndex: number, applyTargetStart: ApplyTarget, applyTargetEnd: ApplyTarget): [FrameFacesEdited[], FrameFacesEdited[], FrameFacesEdited[]] => {
    const selectedFace = frameFaces[selectedFrameIndex].faces[selectedFaceIndex];
    const groupId: number | null = selectedFace?.groupId ?? null;
    const startIndex: number = {
        "All": 0,
        "Range": selectedRange[0],
        "Group": groupId === null? -1: FindGroupStartIndex(frameFaces, selectedFrameIndex, groupId),
        "Frame": selectedFrameIndex,
    }[applyTargetStart];
    const endIndex: number = {
        "All": frameFaces.length-1,
        "Range": selectedRange[1],
        "Group": groupId === null? -1: FindGroupEndIndex(frameFaces, selectedFrameIndex, groupId),
        "Frame": selectedFrameIndex,
    }[applyTargetEnd];

    console.assert(startIndex >= 0 && startIndex < frameFaces.length);
    console.assert(endIndex >= 0 && endIndex < frameFaces.length);
    console.assert(startIndex <= endIndex);

    return [
        frameFaces.slice(0, startIndex),
        frameFaces.slice(startIndex, endIndex+1),
        frameFaces.slice(endIndex+1)
    ];
}


export default ({projectFolder, frameFaces, faceLibFaces, setFrameFaces, selectedRange: [startRange, endRange], selectedFrameIndex}: Props) => {

    const [[applyTargetStart, applyTargetEnd], setApplyTarget] = useState<[ApplyTarget, ApplyTarget]>(["Range", "Range"]);
    // const [similar, setSimilar] = useState<number>(0.85);
    const [positionDistance, setPositionDistance] = useState<number>(0.5);
    const [selectedFaceIndex, setSelectedFaceIndex] = useState<number>(0);
    const [groupIdSwap, setGroupIdSwap] = useState<NumberKV>({});

    useEffect(() => {
        setSelectedFaceIndex(0);
    }, [selectedFaceIndex]);

    const allGroupIds = useMemo(() => new Set(frameFaces.map(({faces}) => faces.map(({groupId}) => groupId)).flat()), [frameFaces]);

    const applyDistance = () => setFrameFaces((oldFaces: FrameFacesEdited[]): FrameFacesEdited[] => {
        const [preFaces, targetFaces, postFaces] = CutFrameFacesArray(oldFaces, [startRange, endRange], selectedFrameIndex, selectedFaceIndex, applyTargetStart, applyTargetEnd);

        console.assert(targetFaces.length >= 2);

        const [first, ...rest] = targetFaces;
        let {faces: prevFaces} = first;

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
                    // else {
                    //     console.log(`no match, ${targetFace.id} targetFace.groupId ${targetFace.groupId} not taken, use same`);
                    // }
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
            });
            if(newTagetFaces.length > 0) {
                prevFaces = newTagetFaces;
            }

            return {...leftFrameArgs, edited, faces: newTagetFaces};
        });

        console.log(`updated frame faces`);
        return [...preFaces, first, ...restFaces, ...postFaces];
    });

    const applyGroupIdSwap = () => setFrameFaces((oldFaces: FrameFacesEdited[]): FrameFacesEdited[] => {
        const [preFaces, targetFaces, postFaces] = CutFrameFacesArray(oldFaces, [startRange, endRange], selectedFrameIndex, selectedFaceIndex, applyTargetStart, applyTargetEnd);

        console.assert(targetFaces.length >= 1);

        const changedTargetFaces = targetFaces.map((eachFrameFaces): FrameFacesEdited => {
            const {faces, ...left} = eachFrameFaces;
            let hasChange: boolean = false;
            const newFaces = faces.map((face): FrameFace => {
                const {groupId} = face;
                const newGroupId = groupIdSwap[groupId];
                if(newGroupId !== undefined && newGroupId !== groupId) {
                    hasChange = true;
                    return {...face, groupId: newGroupId};
                }
                return face;
            });
            if(!hasChange) {
                return eachFrameFaces;
            }
            return {...left, faces: newFaces, edited: true};
        });

        console.log(`updated frame faces`);
        return [...preFaces, ...changedTargetFaces, ...postFaces];
    });

    const applyFaceSwap = (groupId: number, faceLibId: number | null) => setFrameFaces((oldFaces: FrameFacesEdited[]): FrameFacesEdited[] => {
        const [preFaces, targetFaces, postFaces] = CutFrameFacesArray(oldFaces, [startRange, endRange], selectedFrameIndex, selectedFaceIndex, applyTargetStart, applyTargetEnd);

        console.assert(targetFaces.length >= 1);

        const changedTargetFaces = targetFaces.map((eachFrameFaces): FrameFacesEdited => {
            const {faces, ...left} = eachFrameFaces;
            let hasChange: boolean = false;
            const newFaces = faces.map((face): FrameFace => {
                const {groupId: checkGroupId, faceLibId: checkFaceLibId} = face;
                if(groupId !== checkGroupId) {
                    return face;
                }
                if(checkFaceLibId === faceLibId) {
                    return face;
                }
                hasChange = true;
                return {...face, faceLibId};
            });
            if(!hasChange) {
                return eachFrameFaces;
            }
            return {...left, faces: newFaces, edited: true};
        });

        console.log(`updated frame faces`);
        return [...preFaces, ...changedTargetFaces, ...postFaces];
    });

    const selectedAllGroupIds = useMemo(() => {
        const [_, targetFrameFaces, __] = CutFrameFacesArray(frameFaces, [startRange, endRange], selectedFrameIndex, selectedFaceIndex, applyTargetStart, applyTargetEnd);
        return Array.from(new Set(targetFrameFaces.map(({faces}) => faces.map(({groupId}) => groupId)).flat())).sort();
    }, [frameFaces, selectedFrameIndex, selectedFaceIndex]);

    const selectedSwapFaceLibIds = useMemo(() => {
        const [_, targetFrameFaces, __] = CutFrameFacesArray(frameFaces, [startRange, endRange], selectedFrameIndex, selectedFaceIndex, applyTargetStart, applyTargetEnd);
        // return Array.from(new Set(targetFrameFaces.map(({faces}) => faces.map(({groupId}) => groupId)).flat())).sort();
        const groupIdToFaceLibIds = new Map<number, number[]>();
        targetFrameFaces.forEach(({faces}) => {
            faces.forEach(({groupId, faceLibId}) => {
                const faceLibIds = groupIdToFaceLibIds.get(groupId) ?? [];
                if(faceLibId && !faceLibIds.includes(faceLibId)) {
                    faceLibIds.push(faceLibId);
                }
                groupIdToFaceLibIds.set(groupId, faceLibIds);
            });
        });
        return groupIdToFaceLibIds;

    }, [frameFaces, selectedFrameIndex, selectedFaceIndex]);

    const previewFrameSwap = () => {
        const {filePath, faces} = frameFaces[selectedFrameIndex];
        window.electron.ipcRenderer.Edit.PreviewFrameSwap(projectFolder, {
            filePath,
            swapInfo: faces
                .filter(({faceLibId}) => faceLibId !== null)
                .map(({face: source, faceLibId}) => ({
                    source,
                    target: faceLibFaces.find(each => each.id === faceLibId)!.face,
                }))
        })
        .then(swappedToPath => {
            console.log(`done, swap to`, swappedToPath);
            return setFrameFaces(prev => prev.map(each => each.filePath === filePath
                ? { ...each, swappedToPath}
                : each));
        });
    }

    return <>
        <Stack direction="row">
            <Select
                value={applyTargetStart}
                label="From"
                onChange={(event) => setApplyTarget(([_, end]) => ([event.target.value as ApplyTarget, end]))}
            >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Range">Range</MenuItem>
                <MenuItem value="Group">Group</MenuItem>
                <MenuItem value="Frame">Frame</MenuItem>
            </Select>
            <Select
                value={applyTargetEnd}
                label="To"
                onChange={(event) => setApplyTarget(([start, _]) => ([start, event.target.value as ApplyTarget]))}
            >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Range">Range</MenuItem>
                <MenuItem value="Group">Group</MenuItem>
                <MenuItem value="Frame">Frame</MenuItem>
            </Select>
        </Stack>

        <Box>
            <TextField
                inputProps={{inputMode: 'numeric'}}
                label="Max Distance"
                value={positionDistance}
                onChange={(event) => setPositionDistance(parseFloat(event.target.value))}
            />
            <Button onClick={applyDistance}>Apply</Button>
        </Box>

        <Box>
            <SwapGroupIds
                onSwapChanged={setGroupIdSwap}
                checkGroupIds={selectedAllGroupIds}
                allGroupIds={Array.from(allGroupIds).sort()}
            />
            <Button onClick={applyGroupIdSwap} disabled={Object.keys(groupIdSwap).length === 0}>Apply</Button>
        </Box>

        <Box>
            <SwapFaceIds
                key={selectedFrameIndex}
                projectFolder={projectFolder}
                allFaces={faceLibFaces}
                checkGroupIds={selectedSwapFaceLibIds}
                onSwapChanged={applyFaceSwap}
            />
            <Button onClick={previewFrameSwap}>Preview This Frame</Button>
        </Box>
    </>;
}
