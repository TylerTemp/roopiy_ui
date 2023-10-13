import { useMemo } from "react";
import { useParams } from "react-router-dom";
import RetryErrorSuspense, { RendererProps } from "~/Components/RetryErrorSuspense";
import { FrameFaces } from "~s/Types/Edit";


interface FrameFacesRendererProps extends RendererProps<FrameFaces[]> {
    projectFolder: string;
}


const FrameFacesRenderer = ({getResource: getFrameFaces, projectFolder}: FrameFacesRendererProps) => {
    const frameFaces = getFrameFaces();
    return <>{frameFaces.map(frameFace => <div key={frameFace.frameFile}>
        <img src={`project://${projectFolder}/frames/${frameFace.frameFile}`} alt={frameFace.frameFile} />
        <div>frame: {frameFace.frameFile}</div>
        <div>faces: {frameFace.faces.map((face, index) => <div key={index}>
            <div>face: {index}</div>
        </div>)}</div>
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
