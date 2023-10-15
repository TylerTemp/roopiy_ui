import { useState } from "react"
import Face from "~s/Types/Face";
import Select, { SelectChangeEvent } from '@mui/material/Select';
import ProgressOverlay from "~/Components/ProgressOverlay";
import MenuItem from '@mui/material/MenuItem';
import Button from "@mui/material/Button";
import { GetRectFromFace } from "~s/Face";
import enqueueSnackbar from "~/Utils/enqueueSnackbar";
import TextField from "@mui/material/TextField";
import ImageFullDraw from "../ImageFullDraw";

interface ImageSize {
    width: number;
    height: number;
}

export interface FaceLibBaseType {
    face: Face,
    file: string,
    fullFile: string,
    alias: string,
}

export interface FaceLibType extends FaceLibBaseType {
    id: number,
}


interface Props {
    onAddFace: (face: Pick<FaceLibBaseType, "face" | "file" | "alias">) => Promise<void>;
}

export default ({onAddFace}: Props) => {
    const [fullPath, setFullPath] = useState<string | null>(null);
    const [imageSize, setImageSize] = useState<ImageSize | null>(null);
    const [loadingFaces, setLoadingFaces] = useState<boolean>(false);
    const [faces, setFaces] = useState<Face[]>([]);
    const [selectedFaceindex, setSelectedFaceIndex] = useState<number>(0);

    const [name, setName] = useState<string>('');

    const onOk = () => {
        const alias = name.trim();
        if(alias === '') {
            enqueueSnackbar('Name cannot be empty', 'error');
            return;
        }

        const face: Face = faces[selectedFaceindex];

        onAddFace({
            face,
            file: fullPath as string,
            alias
        })
            .then(() => {
                setFullPath(null);
                setImageSize(null);
                setFaces([]);
            })
            .catch(({message}) => enqueueSnackbar(message));
    }

    return <>
        <input type="file" accept="image/*"
            onChange={evt => {
                // console.log(evt);
                const {path} = evt.target.files?.[0] as any || {};
                if(path === undefined) {
                    return;
                }
                // const uriPath = path.replaceAll('\\', '/');

                console.log(path);
                setFullPath(path);

                window.electron.ipcRenderer.Edit.GetImageSize(path)
                    .then((size: ImageSize) => setImageSize(size))
                    .catch(console.log);

                setSelectedFaceIndex(0);
                setFaces([]);
                setLoadingFaces(true)
                window.electron.ipcRenderer.Util.IdentifyFaces(path)
                    .then(setFaces)
                    .then(() => setLoadingFaces(false))
                    .catch(({message}) => enqueueSnackbar(message, 'error'));
            }}
        />

        {fullPath && imageSize && <ImageFullDraw
            src={`extfile://${fullPath.replaceAll('\\', '/')}`}
            width={imageSize.width}
            height={imageSize.height}
            drawInfos={faces.map((eachFace: Face, index: number) => ({
                text: '{index}',
                rect: GetRectFromFace(eachFace),
                color: index === selectedFaceindex? 'green': 'black'
            }))}
        />}

        <ProgressOverlay loading={loadingFaces}>
            {faces.length > 0
                ? <>
                    <Select
                            value={selectedFaceindex.toString()}
                            label="Face"
                            onChange={({target: {value}}: SelectChangeEvent) => setSelectedFaceIndex(parseInt(value, 10))}
                        >
                            {faces.map((_face, index) => <MenuItem value={index.toString()} key={index}>{index}</MenuItem>)}
                    </Select>
                    <TextField
                        label="Name"
                        required
                        value={name}
                        onChange={({target: {value}}) => setName(value)}
                    />
                </>
                : `No face found`}

        </ProgressOverlay>

        {faces.length > 0 && <>
            <Button onClick={onOk}>OK</Button>
            <Button onClick={() => {
                setFullPath(null);
                setImageSize(null);
                setFaces([]);
            }}>Cancel</Button>
        </>}
    </>;
}