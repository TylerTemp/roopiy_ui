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

import type ProjectTyep from '~s/Types/Project';
import Collapse from "@mui/material/Collapse";

const emptyProject: ProjectTyep = {
    referenceVideoFile: '',
    referenceVideoSlice: true,
    referenceVideoFrom: '0',
    referenceVideoTo: '',
    sourceVideoFile: 'source.mp4',
};

export default () => {

    // const [echo, setEcho] = useState('');
    const [projectList, setProjectList] = useState<string[]>([]);

    const { getPromise, addCache } = usePromiseCache<ProjectTyep>();

    useEffect(() => {
        window.electron.ipcRenderer.project.GetList().then(setProjectList);
    }, []);

    const [selectedProjectFolder, setSelectedProjectFolder] = useState<string>('');
    const [project, setProject] = useState<ProjectTyep>(emptyProject);

    const isNewProject = useMemo(() => !projectList.includes(selectedProjectFolder), [projectList, selectedProjectFolder]);
    useEffect(() => {
        if(projectList.includes(selectedProjectFolder)) {
            getPromise(selectedProjectFolder, () => window.electron.ipcRenderer.project.GetConfig(selectedProjectFolder))
                .then(setProject);
        }
        // else {
        //     setProject(emptyProject);
        // }
    }, [selectedProjectFolder]);

    // const inputFileRef = useRef<HTMLInputElement>(null);

    const createProject = () => window.electron.ipcRenderer.project.CreateConfig(selectedProjectFolder, project)
        .then(() => {
            addCache(selectedProjectFolder, project);
            setProjectList(oldList => [selectedProjectFolder, ...oldList]);
            enqueueSnackbar('Project created', 'success');
        })
        .catch(err => enqueueSnackbar(err.message, 'error'));

    console.log(isNewProject);

    return <>
        <Stack gap={1}>
            <Autocomplete
                freeSolo
                value={selectedProjectFolder}
                onChange={(_event, newValue) => {
                    // console.log(`autoComplete onChange`, newValue);
                    return setSelectedProjectFolder(newValue || '');
                }}
                options={projectList}
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
                value={project.referenceVideoFile}
                onChange={(evt) => setProject({...project, referenceVideoFile: evt.target.value})}
            />

            <FormControlLabel
                label="Slice"
                control={<Checkbox
                    readOnly={!isNewProject}
                    disabled={!isNewProject}
                    checked={project.referenceVideoSlice}
                    onChange={(evt) => setProject({...project, referenceVideoSlice: evt.target.checked})}
                />}
            />

            <Collapse in={project.referenceVideoSlice}>
                <Stack direction="row" gap={1} >
                    <TextField
                        fullWidth
                        variant="standard"
                        label="From"
                        disabled={!isNewProject}
                        error={project.referenceVideoSlice && project.referenceVideoFrom === '' && project.referenceVideoTo === ''}
                        value={project.referenceVideoFrom}
                        onChange={(evt) => setProject({...project, referenceVideoFrom: evt.target.value})}
                    />
                    <TextField
                        fullWidth
                        variant="standard"
                        label="To"
                        disabled={!isNewProject}
                        error={project.referenceVideoSlice && project.referenceVideoFrom === '' && project.referenceVideoTo === ''}
                        value={project.referenceVideoTo}
                        onChange={(evt) => setProject({...project, referenceVideoTo: evt.target.value})}
                    />
                </Stack>
            </Collapse>

            <TextField
                variant="standard"
                label="Source Video"
                disabled
                value={project.sourceVideoFile}
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
