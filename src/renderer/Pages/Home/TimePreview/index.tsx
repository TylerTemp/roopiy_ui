import IconButton from "@mui/material/IconButton"
import InputAdornment from "@mui/material/InputAdornment"
import TextField from "@mui/material/TextField"
import VisibilityIcon from '@mui/icons-material/Visibility';
import { ReloadingIcon } from "~/Components/RotateClass";
import { useState } from "react";
import Box from "@mui/material/Box";
import Style from './index.scss';
import { ParseFFmpegTime } from "~s/Util";


const GetFileExtension = (filePath: string): string => {
    // Use the '/' character to split the path into segments
    const pathSegments = filePath.split('/');

    // Get the last segment, which is the file name
    const fileName = pathSegments[pathSegments.length - 1];

    // Split the file name into name and extension using the '.' character
    const fileParts = fileName.split('.');

    // Check if there is at least one '.' character in the file name、
    console.assert(fileParts.length);

    // The last part is the file extension
    const fileExtension = fileParts[fileParts.length - 1];
    return `.${fileExtension}`;
}

interface Props {
    label: string,
    error: boolean,
    value: string,
    onChange: (value: string) => void,
    durationOffset: number,
    projectFolder: string,
    referenceVideoFile: string,
}

export default ({label, error, value, onChange, durationOffset, projectFolder, referenceVideoFile}: Props) => {

    const [loading, setLoading] = useState<boolean>(false);
    const [videoFile, setVideoFile] = useState<string | null>(null);

    // const [videoTime, setVideoTime]

    const [reload, setReload] = useState<number>(1);

    const LoadVideo = () => {
        setLoading(true);
        const curTime: number = ParseFFmpegTime(value);

        const startTime: number = durationOffset > 0? curTime: curTime + durationOffset;
        // const endTime: number = durationOffset > 0? curTime + durationOffset: curTime;
        const duration: number = Math.abs(durationOffset);
        const prevVideoFile = videoFile;
        setVideoFile(null);

        window.electron.ipcRenderer.Project.CutVideo(
            projectFolder,
            referenceVideoFile,
            startTime,
            duration,
            `${durationOffset}${GetFileExtension(referenceVideoFile)}`,
            (cur, total, text) => console.log(cur, total, text),
        )
            .then(result => {
                setVideoFile(result);
                setReload(prev => (prev+1) % 10);
            })
            .catch(err => {
                console.error(err);
                setVideoFile(prevVideoFile);
            })
            .finally(() => setLoading(false));
    }

    return <Box sx={{width: 1}}>
        <TextField
            fullWidth
            variant="standard"
            label={label}
            // disabled={!isNewProject}
            error={error}
            value={value}
            onChange={(evt) => onChange(evt.target.value)}
            InputProps={{
                endAdornment: <InputAdornment position="end">
                    <IconButton
                        onClick={LoadVideo}
                        disabled={loading}
                        edge="end"
                    >
                        {loading? <ReloadingIcon />: <VisibilityIcon />}
                    </IconButton>
                </InputAdornment>
            }}
        />

        {videoFile && <><video controls muted autoPlay className={Style.video} key={`${reload}_${loading}`}>
            <source src={`project://${encodeURIComponent(projectFolder)}/${encodeURI(videoFile)}?q=${reload}`} />
        </video>
            <button type="button" onClick={() => setReload(prev => (prev+1) % 10)}>Reload</button>
        </>}
    </Box>
}
