import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useRef, useState } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from '@mui/material/Checkbox';
import enqueueSnackbar from "~/Utils/enqueueSnackbar";
import usePromiseCache from "~/Utils/usePromiseCache";

import type ProjectType from '~s/Types/Project';
import type { ProjectEdit } from '~s/Types/Project';
import Collapse from "@mui/material/Collapse";
import { useNavigate } from "react-router-dom";
import TitleProgressLoading, { TitleProgressLoadingProps } from "~/Components/TitleProgressLoading";
import { ParseFFmpegTime } from "~s/Util";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import FileTextField from './FileTextField';
import Style from './index.scss'
import TimePreview from "./TimePreview";


function assertIsError(error: unknown): asserts  error is Error {
    // if you have nodejs assert:
    // assert(error instanceof Error);
    // otherwise
    if (!(error instanceof Error)) {
        throw error
    }
}

const emptyProject: ProjectEdit = {
    referenceVideoFile: '',
    referenceVideoSlice: true,
    referenceVideoFrom: '0',
    referenceVideoTo: '',
    sourceVideoFile: 'source.mp4',

    sourceVideoToUse: undefined,
    sourceVideoExtracted: false,
    sourceVideoFaceIdentified: false,
};


const ConvertProjecetToEdit = ({referenceVideoFrom, referenceVideoDuration, referenceVideoSlice, ...left}: ProjectType): ProjectEdit => ({
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

    const { getPromise, addCache } = usePromiseCache<ProjectType>();

    useEffect(() => {
        window.electron.ipcRenderer.Project.GetList().then(setProjectFolderList);
    }, []);

    const [selectedProjectFolder, setSelectedProjectFolder] = useState<string>('');
    const [projectEdit, setProjectEdit] = useState<ProjectEdit>(emptyProject);
    const oriProjectInfo = useRef<ProjectType>(({
        ...emptyProject,
        referenceVideoFrom: 0,
        referenceVideoDuration: 0,
        sourceVideoToUse: '',
        sourceVideoAbs: true,
    }));

    const isNewProject = useMemo(() => !projectFolderList.includes(selectedProjectFolder), [projectFolderList, selectedProjectFolder]);

    const checkLoad = (projectFolder: string): void => {
        if(!projectFolderList.includes(projectFolder)) {
            console.log(`selectedProjectFolder not in projectFolderList`, selectedProjectFolder, projectFolderList);
            return;
        }

        getPromise(
            projectFolder,
            () => window.electron.ipcRenderer.Project.GetConfig(projectFolder)
                // .then(result => {
                //     oriProjectInfo.current = result;
                //     return ConvertProjecetToEdit(result);
                // })
        )
        .then(result => {
            console.log(`getPromise ${projectFolder} result`, result);
            oriProjectInfo.current = result;
            setProjectEdit(ConvertProjecetToEdit(result));
        });
    }

    const CloseThenNavigateToProject = () => {
        window.electron.ipcRenderer.Util.CloseDatabase(selectedProjectFolder);
        navigate(`/edit/${selectedProjectFolder}`);
    }

    const CreateProject = async () => {
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

        const oriProject = oriProjectInfo.current;

        let project: ProjectType = {
            ...oriProject,
            ...left,
            referenceVideoSlice,
            referenceVideoFrom: referenceVideoFromSeconds,
            referenceVideoDuration,
        }

        setLoading({loading: true, loadingText: 'Save Config', loadingProgress: -1});
        try {
            await window.electron.ipcRenderer.Project.SaveConfig(selectedProjectFolder, project);
        } catch (err) {
            console.error(err);
            assertIsError(err)
            enqueueSnackbar(err.message, 'error');
            setLoading({loading: false, loadingText: null, loadingProgress: -1});
            return;
        }

        const reportProgress = (cur: number, total: number, text: string): void => setLoading(prev => ({
            ...prev,
            loadingProgress: total > 0? cur / total: -1,
            loadingText: text,
        }));

        const sourceVideoConfigChanged = project.referenceVideoSlice !== oriProject.referenceVideoSlice
            || project.referenceVideoFrom !== oriProject.referenceVideoFrom
            || project.referenceVideoDuration !== oriProject.referenceVideoDuration
            || project.referenceVideoFile !== oriProject.referenceVideoFile;

        console.log(`sourceVideoConfigChanged`, sourceVideoConfigChanged);

        if(sourceVideoConfigChanged) {
            project.sourceVideoExtracted = false;
            project.sourceVideoFaceIdentified = false;
        }

        if(sourceVideoConfigChanged) {

            setLoading({loading: true, loadingText: 'Copy source', loadingProgress: -1});

            if(project.referenceVideoSlice) {
                try {
                    await window.electron.ipcRenderer.Project.GetVideoSeconds(project.referenceVideoFile)
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
                            return window.electron.ipcRenderer.Project.CutVideoAsSource(selectedProjectFolder, project, reportProgress);
                        })
                        .then(r => {
                            setLoading(prev => ({...prev, loadingProgress: -1, loadingText: `Saving config for ${r}`}));
                            return r;
                        })
                        .then(sourceVideoToUse => {
                            project.sourceVideoToUse = sourceVideoToUse;
                            project.sourceVideoAbs = false;
                            return window.electron.ipcRenderer.Project.SaveConfig(selectedProjectFolder, project);
                        });
                } catch (err) {
                    console.error(err);
                    assertIsError(err)
                    enqueueSnackbar(err.message, 'error');
                    setLoading({loading: false, loadingText: null, loadingProgress: -1});
                    return;
                }
            }
            else
            {
                project.sourceVideoToUse = project.referenceVideoFile;
                project.sourceVideoAbs = true;
                setLoading(prev => ({...prev, loadingProgress: -1, loadingText: `Saving config for ${project.referenceVideoFile}`}));

                try {
                    await window.electron.ipcRenderer.Project.SaveConfig(selectedProjectFolder, project);
                } catch (err) {
                    console.error(err);
                    assertIsError(err)
                    enqueueSnackbar(err.message, 'error');
                    setLoading({loading: false, loadingText: null, loadingProgress: -1});
                    return;
                }
            }
        }

        if(!project.sourceVideoExtracted) {
            setLoading({loading: true, loadingText: 'Extracting video', loadingProgress: -1});
            try {
                await window.electron.ipcRenderer.Project.ExtractVideo(
                    selectedProjectFolder,
                    project,
                    reportProgress,
                );
                project.sourceVideoExtracted = true;
                project.sourceVideoFaceIdentified = false;
                await window.electron.ipcRenderer.Project.SaveConfig(selectedProjectFolder, project);
            } catch (err) {
                console.error(err);
                assertIsError(err)
                enqueueSnackbar(err.message, 'error');
                setLoading({loading: false, loadingText: null, loadingProgress: -1});
                return;
            }
        }

        console.log(`project.sourceVideoFaceIdentified`, project.sourceVideoFaceIdentified);

        if(!project.sourceVideoFaceIdentified) {
            setLoading({loading: true, loadingText: 'Identify faces', loadingProgress: -1});
            try {
                await window.electron.ipcRenderer.Project.ExtractFacesInProject(
                    selectedProjectFolder,
                    (curCount: number, totalCount: number, faceCount: number, name: string)=> setLoading(prev => ({
                        ...prev,
                        loadingText: `Extracting faces: ${curCount}/${totalCount} ${name} (${faceCount} faces)`,
                        loadingProgress: curCount / totalCount
                    }))
                );
                project.sourceVideoFaceIdentified = true;
                await window.electron.ipcRenderer.Project.SaveConfig(selectedProjectFolder, project);
            } catch (err) {
                console.error(err);
                assertIsError(err)
                enqueueSnackbar(err.message, 'error');
                setLoading({loading: false, loadingText: null, loadingProgress: -1});
                return;
            }
        }

        addCache(selectedProjectFolder, project);
        setProjectEdit(ConvertProjecetToEdit(project));
        setLoading({loading: false, loadingText: null, loadingProgress: -1});
        CloseThenNavigateToProject();
    };

    return <Box className={Style.overlayContainer}>
                <form onSubmit={evt => {
                    evt.preventDefault();
                    CreateProject();
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
                        // readOnly={!isNewProject}
                        value={projectEdit.referenceVideoFile}
                        onChange={(evt) => setProjectEdit({...projectEdit, referenceVideoFile: evt.target.value})}
                    />

                    <FormControlLabel
                        label="Slice"
                        control={<Checkbox
                            // readOnly={!isNewProject}
                            // disabled={!isNewProject}
                            checked={projectEdit.referenceVideoSlice}
                            onChange={(evt) => setProjectEdit({...projectEdit, referenceVideoSlice: evt.target.checked})}
                        />}
                    />

                    <Collapse in={projectEdit.referenceVideoSlice}>
                        <Stack direction="row" gap={1} >
                            <TimePreview
                                label="From"
                                error={projectEdit.referenceVideoSlice && projectEdit.referenceVideoFrom === '' && projectEdit.referenceVideoTo === ''}
                                value={projectEdit.referenceVideoFrom}
                                onChange={(value) => setProjectEdit({...projectEdit, referenceVideoFrom: value})}
                                durationOffset={3}
                                projectFolder={selectedProjectFolder}
                                referenceVideoFile={projectEdit.referenceVideoFile}

                            />

                            {/* <TextField
                                fullWidth
                                variant="standard"
                                label="From"
                                // disabled={!isNewProject}
                                error={projectEdit.referenceVideoSlice && projectEdit.referenceVideoFrom === '' && projectEdit.referenceVideoTo === ''}
                                value={projectEdit.referenceVideoFrom}
                                onChange={(evt) => setProjectEdit({...projectEdit, referenceVideoFrom: evt.target.value})}
                            /> */}

                            <TimePreview
                                label="To"
                                error={projectEdit.referenceVideoSlice && projectEdit.referenceVideoFrom === '' && projectEdit.referenceVideoTo === ''}
                                value={projectEdit.referenceVideoTo}
                                onChange={(value) => setProjectEdit({...projectEdit, referenceVideoTo: value})}
                                durationOffset={-3}
                                projectFolder={selectedProjectFolder}
                                referenceVideoFile={projectEdit.referenceVideoFile}

                            />
                            {/* <TextField
                                fullWidth
                                variant="standard"
                                label="To"
                                // disabled={!isNewProject}
                                error={projectEdit.referenceVideoSlice && projectEdit.referenceVideoFrom === '' && projectEdit.referenceVideoTo === ''}
                                value={projectEdit.referenceVideoTo}
                                onChange={(evt) => setProjectEdit({...projectEdit, referenceVideoTo: evt.target.value})}
                            /> */}
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
