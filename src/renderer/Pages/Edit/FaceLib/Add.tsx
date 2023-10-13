import { useState } from "react"
import Face from "~s/Types/Face";
import Select, { SelectChangeEvent } from '@mui/material/Select';
import ProgressOverlay from "~/Components/ProgressOverlay";
import MenuItem from '@mui/material/MenuItem';
import Button from "@mui/material/Button";
import { GetRectFromFace } from "../Face";
import ImageFullDraw from "../ImageFullDraw";

interface ImageSize {
    width: number;
    height: number;
}

export default () => {
    const [fullPath, setFullPath] = useState<string | null>(null);
    const [imageSize, setImageSize] = useState<ImageSize | null>(null);
    const [loadingFaces, setLoadingFaces] = useState<boolean>(false);
    const [faces, setFaces] = useState<Face[]>([]);
    const [selectedFaceindex, setSelectedFaceIndex] = useState<number>(0);

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
                    .catch(console.log);
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
                ? <Select
                        value={selectedFaceindex.toString()}
                        label="Face"
                        onChange={({target: {value}}: SelectChangeEvent) => setSelectedFaceIndex(parseInt(value, 10))}
                    >
                        {faces.map((_face, index) => <MenuItem value={index.toString()} key={index}>{index}</MenuItem>)}
                    </Select>
                : `No face found`}
        </ProgressOverlay>

        {faces.length > 0 && <>
            <Button>OK</Button>
            <Button onClick={() => {
                setFullPath(null);
                setImageSize(null);
                setFaces([]);
            }}>Cancel</Button>
        </>}
    </>;
}