import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import RetryErrorSuspense, { RendererProps } from "~/Components/RetryErrorSuspense";
import { FrameFaces } from "~s/Types/Edit";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Slider from '@mui/material/Slider';
import ImageFullDraw from "./ImageFullDraw";
import { GetRectFromFace } from "./Face";
import Style from "./index.scss";
import FaceLib from "./FaceLib";


interface FrameFacesRendererProps extends RendererProps<FrameFaces[]> {
    projectFolder: string;
}


const FrameFacesRenderer = ({getResource: getFrameFaces, projectFolder}: FrameFacesRendererProps) => {
    const frameFaces = getFrameFaces();

    const [selectedRange, setSelectedRange] = useState<[number, number]>([0, frameFaces.length-1]);
    const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(0);

    const WrapSetSelectedRange = ([new1, new2]: [number, number]) => setSelectedRange(([prev1, prev2]) => {
        if(prev1 !== new1) {
            setSelectedFrameIndex(new1);
        }
        else if (prev2 !== new2) {
            setSelectedFrameIndex(new2);
        }
        return [new1, new2];
    });

    const {frameFile, faces, width, height} = frameFaces[selectedFrameIndex];

    return <>
        <Stack gap={2} className={Style.mainContainer}>
            <ImageFullDraw
                src={`project://${projectFolder}/frames/${frameFile}`}
                width={width}
                height={height}
                drawInfos={faces.map(eachFace => ({
                    rect: GetRectFromFace(eachFace),
                    text: '{index}'
                }))} />
            <Typography variant="caption" className={Style.textCenter}>{frameFile}[{faces.length}]</Typography>

            <Slider
                value={selectedRange}
                step={1}
                marks
                min={0}
                max={frameFaces.length-1}
                onChange={(event: Event, newValue: number | number[]) => WrapSetSelectedRange(newValue as [number, number])}
            />

            <Slider
                value={selectedFrameIndex}
                valueLabelDisplay="auto"
                step={1}
                marks
                min={selectedRange[0]}
                max={selectedRange[1]}
                onChange={(event: Event, newValue: number | number[]) => setSelectedFrameIndex(newValue as number)}
            />

        </Stack>
    </>;
}


export default () => {
    const { projectFolder } = useParams();
    console.assert(projectFolder, 'projectFolder is null');

    const makePromise = useMemo(() => {
        return () => window.electron.ipcRenderer.Edit.GetProjectFrameFaces(projectFolder as string)
    }, [projectFolder]);

    return <>
        <Typography variant="h1" className={Style.textCenter}>{projectFolder}</Typography>

        <FaceLib projectFolder={projectFolder as string} />

        <RetryErrorSuspense<FrameFaces[]>
            noTrace
            makePromise={makePromise}
            fallback={<>Loading...</>}
            renderer={props => <FrameFacesRenderer projectFolder={projectFolder as string} {...props}/>}
        />
    </>;
}
