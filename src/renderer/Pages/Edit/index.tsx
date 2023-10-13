import { useMemo } from "react";
import { useParams } from "react-router-dom";
import RetryErrorSuspense, { RendererProps } from "~/Components/RetryErrorSuspense";
import { FrameFaces } from "~s/Types/Edit";
import Style from './index.scss';
import Box from "@mui/material/Box";
import ImageFullDraw from "./ImageFullDraw";
import { GetRectFromFace } from "./Face";


interface FrameFacesRendererProps extends RendererProps<FrameFaces[]> {
    projectFolder: string;
}


const FrameFacesRenderer = ({getResource: getFrameFaces, projectFolder}: FrameFacesRendererProps) => {
    const frameFaces = getFrameFaces();
    return <>{frameFaces.map(({frameFile, faces, width, height}) => <div key={frameFile}>
        <ImageFullDraw
            src={`project://${projectFolder}/frames/${frameFile}`}
            width={width}
            height={height}
            drawInfos={faces.map((eachFace, index) => ({
                key: index.toString(),
                rect: GetRectFromFace(eachFace),
            }))} />
        <div>frame: {frameFile} / {faces.length}</div>
        {/* <div>faces: {frameFace.faces.map((face, index) => <div key={index}>
            <div>face: {index}</div>
        </div>)}</div> */}
    </div>)}</>;
}


export default () => {
    const { projectFolder } = useParams();
    console.assert(projectFolder, 'projectFolder is null');

    const makePromise = useMemo(() => {
        return () => window.electron.ipcRenderer.Edit.GetProjectFrameFaces(projectFolder as string)
    }, [projectFolder]);

    return <>
            <RetryErrorSuspense<FrameFaces[]>
            noTrace
            makePromise={makePromise}
            fallback={<>Loading...</>}
            renderer={props => <FrameFacesRenderer projectFolder={projectFolder as string} {...props}/>}
        />
    </>;
}
