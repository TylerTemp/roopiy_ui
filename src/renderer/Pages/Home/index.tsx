import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from '@mui/material/Checkbox';
import enqueueSnackbar from "~/Utils/enqueueSnackbar";
import usePromiseCache from "~/Utils/usePromiseCache";

import type ProjectType from '~s/Types/Project';
import type { ProjectEdit } from '~s/Types/Project';
import Collapse from "@mui/material/Collapse";
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import useTheme from "@mui/material/styles/useTheme";
import { useNavigate } from "react-router-dom";
import Style from './index.scss'
import FileTextField from './FileTextField';
import TitleProgressLoading, { TitleProgressLoadingProps } from "~/Components/TitleProgressLoading";


const ParseFFmpegTime = (timeStr: string): number => {
    const floatPart: string = timeStr.includes('.') ? timeStr.split('.')[1] : '';
    let totalSeconds: number;

    const parts: string[] = timeStr.split(':');

    let hours: string | undefined;
    let minutes: string | undefined;
    let seconds: string | undefined;

    if (parts.length === 3) {
        [hours, minutes, seconds] = parts;
        totalSeconds = parseInt(hours, 10) * 3600 + parseInt(minutes, 10) * 60 + parseInt(seconds, 10);
    } else if (parts.length === 2) {
        [minutes, seconds] = parts;
        totalSeconds = parseInt(minutes, 10) * 60 + parseInt(seconds, 10);
    } else if (parts.length === 1) {
        totalSeconds = parseInt(parts[0], 10);
        console.log(`parsed: ${parts} -> ${totalSeconds}${floatPart}`);
    } else {
        throw new Error(`Invalid time string: ${timeStr}`);
    }

    console.assert(!Number.isNaN(totalSeconds), `totalSeconds is NaN: ${timeStr}`);
    const floatValue: number = (floatPart ? parseFloat(`0.${floatPart}`) : 0);
    console.assert(!Number.isNaN(floatValue), `floatValue is NaN: ${floatPart}`);

    return totalSeconds + floatValue;
}


const emptyProject: ProjectEdit = {
    referenceVideoFile: '',
    referenceVideoSlice: false,
    referenceVideoFrom: '0',
    referenceVideoTo: '',
    sourceVideoFile: 'source.mp4',
};


const ProjecetToEdit = ({referenceVideoFrom, referenceVideoDuration, referenceVideoSlice, ...left}: ProjectType): ProjectEdit => ({
    ...left,
    referenceVideoSlice,
    referenceVideoFrom: referenceVideoSlice? referenceVideoFrom!.toString(): emptyProject.referenceVideoFrom,
    referenceVideoTo: referenceVideoSlice? (referenceVideoFrom! + referenceVideoDuration!).toString(): emptyProject.referenceVideoTo,
});


export default () => {

    const navigate = useNavigate();

    const [{loading, loadingText, loadingProgress}, setLoading] = useState<TitleProgressLoadingProps>({
        loading: false,
        loadingText: null,
        loadingProgress: -1,
    });

    const [projectFolderList, setProjectFolderList] = useState<string[]>([]);

    const { getPromise, addCache } = usePromiseCache<ProjectEdit>();

    useEffect(() => {
        window.electron.ipcRenderer.Project.GetList().then(setProjectFolderList);
    }, []);

    const [selectedProjectFolder, setSelectedProjectFolder] = useState<string>('');
    const [projectEdit, setProjectEdit] = useState<ProjectEdit>(emptyProject);

    const isNewProject = useMemo(() => !projectFolderList.includes(selectedProjectFolder), [projectFolderList, selectedProjectFolder]);

    const checkLoad = (projectFolder: string): void => {
        if(!projectFolderList.includes(projectFolder)) {
            console.log(`selectedProjectFolder not in projectFolderList`, selectedProjectFolder, projectFolderList);
            return;
        }

        getPromise(
            projectFolder,
            () => window.electron.ipcRenderer.Project.GetConfig(projectFolder)
                .then(ProjecetToEdit)
        )
        .then(result => {
            console.log(`getPromise ${projectFolder} result`, result);
            setProjectEdit(result);
        });
    }

    const NavigateToProject = () => {
        navigate(`/edit/${selectedProjectFolder}`);
    }

    const CreateProject = () => {
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

        setLoading({loading: true, loadingText: 'Extracting video', loadingProgress: -1});
        window.electron.ipcRenderer.Project.GetVideoSeconds(project.referenceVideoFile)
            .then((seconds: number) => {
                console.log(seconds);
                if(referenceVideoSlice && referenceVideoDuration! <= 0) {
                    project = {...project, referenceVideoDuration: (seconds - referenceVideoFromSeconds!)}
                }
                if(referenceVideoSlice) {
                    if(project.referenceVideoFrom! > seconds) {
                        throw new Error(`Invalid slice time: from(${project.referenceVideoFrom}) > duration(${seconds})`);
                    }
                    if(project.referenceVideoFrom! + project.referenceVideoDuration! > seconds) {
                        throw new Error(`Invalid slice time: from(${project.referenceVideoFrom}) + duration(${project.referenceVideoDuration}) > duration(${seconds})`);
                    }
                }
                const duration = referenceVideoSlice? project.referenceVideoDuration!: seconds;
                const estimateImageCount = Math.round(duration * 30);
                return window.electron.ipcRenderer.Project.ExtractVideo(
                    selectedProjectFolder,
                    project,
                    // value => console.log(`frame:`, value, estimateImageCount),
                    value => setLoading({loading: true, loadingText: `Extracting video: ${value}/${estimateImageCount}`, loadingProgress: value / estimateImageCount}),
                );
            })

            .then(() => setLoading({loading: true, loadingText: 'Extracting faces', loadingProgress: -1}))
            .then(() => window.electron.ipcRenderer.Project.ExtractFacesInProject(
                selectedProjectFolder,
                (curCount: number, totalCount: number, faceCount: number, name: string)=> setLoading({
                    loading: true,
                    loadingText: `Extracting faces: ${curCount}/${totalCount} ${name} (${faceCount} faces)`,
                    loadingProgress: curCount / totalCount
                })
            ))

            .then(() => {
                setLoading({loading: true, loadingText: 'Saving project', loadingProgress: -1});
                return window.electron.ipcRenderer.Project.SaveConfig(selectedProjectFolder, project);
            })
            .then(() => addCache(selectedProjectFolder, ProjecetToEdit(project)))
            .then(() => setLoading({loading: false, loadingText: null, loadingProgress: -1}))
            .then(NavigateToProject)
            .catch(err => {
                console.error(err);
                setLoading({loading: false, loadingText: null, loadingProgress: -1});
                enqueueSnackbar(err.message, 'error');
            });
    };

    // console.log(isNewProject);
    // const theme = useTheme();

    return <Box className={Style.overlayContainer}>
                <form onSubmit={evt => {
                    evt.preventDefault();
                    if(isNewProject) {
                        CreateProject();
                    }
                    else {
                        NavigateToProject();
                    }
                }}>
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
                        fullWidth
                        variant="standard"
                        label="Source Video"
                        disabled
                        value={projectEdit.sourceVideoFile}
                        InputProps={{
                            readOnly: true
                        }}
                    />

                    {/* <Box>
                        {isNewProject && <Button onClick={createProject}>Create</Button>}
                        {!isNewProject && <Button>Select</Button>}
                    </Box> */}
                    <Button type="submit">{isNewProject? 'Create': 'Go'}</Button>
                    </Stack>
                </form>

                {/* <Box className={Style.overlay} sx={{display: loading? undefined: 'none', background: theme.dim}}>
                    {loadingText && <Typography variant="caption">{loadingText}</Typography>}
                    {loadingProgress < 0
                        ? <CircularProgress />
                        : <LinearProgress variant="determinate" value={loadingProgress * 100} className={Style.progress}/>}
                </Box> */}
                <TitleProgressLoading
                    loading={loading}
                    loadingText={loadingText}
                    loadingProgress={loadingProgress}
                />

            </Box>;
}
