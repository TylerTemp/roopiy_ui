import { Fragment, useState } from "react";
// export type FaceLibType = FaceLibType;
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import Add, { type FaceLibBaseType, type FaceLibType } from "./Add"
import ViewFullScreen from "./ViewFullScreen";

export { type FaceLibType } from "./Add"


const RenderFaceChip = ({projectFolder, face: {file, fullFile, alias}}: {projectFolder: string, face: FaceLibType}) => {
    // const {file, alias} = face;
    const [hidden, setHidden] = useState<boolean>(true);
    return <>
        <Chip
            avatar={<Avatar src={`project://${projectFolder}/${file}`} alt={alias} />}
            label={alias}
            variant="outlined"
            onClick={() => setHidden(false)}
            onDelete={console.log}
        />
        <ViewFullScreen src={`project://${projectFolder}/${fullFile}`} alt={alias} hidden={hidden} setHide={() => setHidden(true)} />
    </>;
    // return <RenderFaceInImage projectFolder={projectFolder} file={file} face={face} />
    // return <img src={`project://${projectFolder}/${file}`} alt={alias} />
}


interface Props {
    projectFolder: string,
    faces: FaceLibType[],
    onAddFace: (face: FaceLibType) => void,
}

export default ({projectFolder, faces, onAddFace}: Props) => {

    const [cachedFaces, setCachedFaces] = useState<FaceLibType[]>(faces);

    const addFace = (faceLibBase: Pick<FaceLibBaseType, "face" | "file" | "alias">): Promise<void> => {
        const {face, file, alias} = faceLibBase;
        return window.electron.ipcRenderer.Edit.SaveFaceLib(projectFolder, face, file, alias)
            .then((savedFace: FaceLibType) => {
                setCachedFaces(prev => [...prev, savedFace]);
                onAddFace(savedFace);
            });
    }

    return <>
        {cachedFaces.map(each => <RenderFaceChip key={each.id} projectFolder={projectFolder} face={each} />)}
        <Add onAddFace={addFace}/>
    </>;
}
