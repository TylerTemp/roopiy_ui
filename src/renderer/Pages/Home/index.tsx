import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Input from "@mui/material/Input";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import VideoFileIcon from '@mui/icons-material/VideoFile';
import { useEffect, useMemo, useRef, useState } from "react";
import FileTextField from './FileTextField';
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from '@mui/material/Checkbox';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Style from './index.scss'
import enqueueSnackbar from "~/Utils/enqueueSnackbar";
import usePromiseCache from "~/Utils/usePromiseCache";

import type ProjectType from '~s/Types/Project';
import type { ProjectEdit } from '~s/Types/Project';
import Collapse from "@mui/material/Collapse";


const ParseFFmpegTime = (timeStr: string): number => {
    const floatPart: string = timeStr.includes('.') ? timeStr.split('.')[1] : '';
    let totalSeconds: number;

    const parts: string[] = timeStr.split(':');

    let hours: string | undefined;
    let minutes: string | undefined;
    let seconds: string | undefined;

    if (parts.length === 3) {
        [hours, minutes, seconds] = parts;
        totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
    } else if (parts.length === 2) {
        [minutes, seconds] = parts;
        totalSeconds = parseInt(minutes) * 60 + parseInt(seconds);
    } else if (parts.length === 1) {
        totalSeconds = parseInt(parts[0]);
        console.log(`parsed: ${parts} -> ${totalSeconds}${floatPart}`);
    } else {
        throw new Error(`Invalid time string: ${timeStr}`);
    }

    console.assert(!isNaN(totalSeconds), `totalSeconds is NaN: ${timeStr}`);
    const floatValue: number = (floatPart ? parseFloat(`0.${floatPart}`) : 0);
    console.assert(!isNaN(floatValue), `floatValue is NaN: ${floatPart}`);

    return totalSeconds + floatValue;
}


const emptyProject: ProjectEdit = {
    referenceVideoFile: '',
    referenceVideoSlice: true,
    referenceVideoFrom: '0',
    referenceVideoTo: '',
    sourceVideoFile: 'source.mp4',
};

export default () => {

    // const [echo, setEcho] = useState('');
    const [projectFolderList, setProjectFolderList] = useState<string[]>([]);

    const { getPromise, addCache } = usePromiseCache<ProjectEdit>();

    useEffect(() => {
        window.electron.ipcRenderer.project.GetList().then(setProjectFolderList);
    }, []);

    const [selectedProjectFolder, setSelectedProjectFolder] = useState<string>('');
    const [projectEdit, setProjectEdit] = useState<ProjectEdit>(emptyProject);

    const isNewProject = useMemo(() => !projectFolderList.includes(selectedProjectFolder), [projectFolderList, selectedProjectFolder]);
    // useEffect(() => {
    //     if(projectFolderList.includes(selectedProjectFolder)) {
    //         getPromise(
    //             selectedProjectFolder,
    //             () => window.electron.ipcRenderer.project.GetConfig(selectedProjectFolder)
    //                 .then(({referenceVideoFrom, referenceVideoDuration, referenceVideoSlice, ...left}: ProjectType): ProjectEdit => ({
    //                     ...left,
    //                     referenceVideoSlice,
    //                     referenceVideoFrom: referenceVideoSlice? referenceVideoFrom!.toString(): emptyProject.referenceVideoFrom,
    //                     referenceVideoTo: referenceVideoSlice? (referenceVideoFrom! + referenceVideoDuration!).toString(): emptyProject.referenceVideoTo,
    //                 }))
    //         )
    //         .then(setProjectEdit);
    //     }
    //     // else {
    //     //     setProject(emptyProject);
    //     // }
    // }, [selectedProjectFolder]);
    const checkLoad = (projectFolder: string): void => {
        if(!projectFolderList.includes(selectedProjectFolder)) {
            return;
        }

        getPromise(
            projectFolder,
            () => window.electron.ipcRenderer.project.GetConfig(selectedProjectFolder)
                .then(({referenceVideoFrom, referenceVideoDuration, referenceVideoSlice, ...left}: ProjectType): ProjectEdit => ({
                    ...left,
                    referenceVideoSlice,
                    referenceVideoFrom: referenceVideoSlice? referenceVideoFrom!.toString(): emptyProject.referenceVideoFrom,
                    referenceVideoTo: referenceVideoSlice? (referenceVideoFrom! + referenceVideoDuration!).toString(): emptyProject.referenceVideoTo,
                }))
        )
        .then(result => {
            if(projectFolder === selectedProjectFolder) {
                setProjectEdit(result);
            }
        });
    }

    // const inputFileRef = useRef<HTMLInputElement>(null);

    const createProject = () => {
        const {referenceVideoSlice, referenceVideoFrom, referenceVideoTo, ...left} = projectEdit;
        if (referenceVideoSlice && (referenceVideoFrom === '' && referenceVideoTo === '')) {
            enqueueSnackbar('Invalid slice time', 'error');
            return;
        }

        let referenceVideoDuration: number | null = null;
        let referenceVideoFromSeconds: number | null = null;
        if(referenceVideoSlice) {
            referenceVideoFromSeconds = referenceVideoFrom === ''? 0: ParseFFmpegTime(referenceVideoFrom);
            // const referenceVideoToSeconds: number = ParseFFmpegTime(referenceVideoTo);
            referenceVideoDuration = referenceVideoTo === ''
                ? -1
                : ParseFFmpegTime(referenceVideoTo) - referenceVideoFromSeconds;
        }

        let project: ProjectType = {
            ...left,
            referenceVideoSlice,
            referenceVideoFrom: referenceVideoFromSeconds,
            referenceVideoDuration,
        }


        // const project: ProjectType = {
        return window.electron.ipcRenderer.project.GetVideoSeconds(project.referenceVideoFile)
            .then((seconds: number) => {
                console.log(seconds);
                if(referenceVideoSlice && referenceVideoDuration! <= 0) {
                    project = {...project, referenceVideoDuration: (seconds - referenceVideoFromSeconds!)}
                }
                const duration = referenceVideoSlice? project.referenceVideoDuration!: seconds;
                const estimateImageCount = Math.round(duration * 30);
                window.electron.ipcRenderer.project.ExtractVideo(
                    selectedProjectFolder,
                    project,
                    value => console.log(value, estimateImageCount),
                )
                .then(() => console.log("all finished extract"))
                .catch(err => console.log(`errored...`, err));
            })
            // .then(() => {
            //     addCache(selectedProjectFolder, projectEdit);
            //     setProjectFolderList(oldList => [selectedProjectFolder, ...oldList]);
            //     enqueueSnackbar('Project created', 'success');
            // })
            // .catch(err => enqueueSnackbar(err.message, 'error'));
    };

    console.log(isNewProject);

    return <>
        <Stack gap={1}>
            <Autocomplete
                freeSolo
                value={selectedProjectFolder}
                onChange={(_event, newValue) => {
                    // console.log(`autoComplete onChange`, newValue);
                    setSelectedProjectFolder(newValue || '');
                    checkLoad(newValue || '');
                }}
                options={projectFolderList}
                renderInput={({InputProps, InputLabelProps, ...params}) => <TextField
                    {...params}
                    // sx={{minWidth: '200px'}}
                    variant="standard"
                    label="Project"
                    InputProps={{
                        ...InputProps,
                        onChange: (evt) => {
                            // console.log(`input onChange`, evt.target.value);
                            return setSelectedProjectFolder(evt.target.value);
                        },
                        // sx: {minWidth: '200px'},
                        // value: inputValue,
                    }}
                    InputLabelProps={{
                        ...InputLabelProps,
                        required: true,
                    }}
                    error={selectedProjectFolder === ''}
                    // inputProps={{
                    //     ...inputProps,
                    //     sx: {minWidth: '500px'},
                    // }}
                    placeholder="Choose a project"
                />}
            />

            <Typography variant="caption">
                Source Video
            </Typography>

            <FileTextField
                readOnly={!isNewProject}
                value={projectEdit.referenceVideoFile}
                onChange={(evt) => setProjectEdit({...projectEdit, referenceVideoFile: evt.target.value})}
            />

            <FormControlLabel
                label="Slice"
                control={<Checkbox
                    readOnly={!isNewProject}
                    disabled={!isNewProject}
                    checked={projectEdit.referenceVideoSlice}
                    onChange={(evt) => setProjectEdit({...projectEdit, referenceVideoSlice: evt.target.checked})}
                />}
            />

            <Collapse in={projectEdit.referenceVideoSlice}>
                <Stack direction="row" gap={1} >
                    <TextField
                        fullWidth
                        variant="standard"
                        label="From"
                        disabled={!isNewProject}
                        error={projectEdit.referenceVideoSlice && projectEdit.referenceVideoFrom === '' && projectEdit.referenceVideoTo === ''}
                        value={projectEdit.referenceVideoFrom}
                        onChange={(evt) => setProjectEdit({...projectEdit, referenceVideoFrom: evt.target.value})}
                    />
                    <TextField
                        fullWidth
                        variant="standard"
                        label="To"
                        disabled={!isNewProject}
                        error={projectEdit.referenceVideoSlice && projectEdit.referenceVideoFrom === '' && projectEdit.referenceVideoTo === ''}
                        value={projectEdit.referenceVideoTo}
                        onChange={(evt) => setProjectEdit({...projectEdit, referenceVideoTo: evt.target.value})}
                    />
                </Stack>
            </Collapse>

            <TextField
                variant="standard"
                label="Source Video"
                disabled
                value={projectEdit.sourceVideoFile}
                InputProps={{
                    readOnly: true
                }}
            />

            <Box>
                {isNewProject && <Button onClick={createProject}>Create</Button>}
                {!isNewProject && <Button>Select</Button>}
            </Box>
        </Stack>

    </>;
}
