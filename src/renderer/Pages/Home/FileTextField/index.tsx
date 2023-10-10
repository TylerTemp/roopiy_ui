import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Input from "@mui/material/Input";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import VideoFileIcon from '@mui/icons-material/VideoFile';
import { useEffect, useMemo, useRef, useState } from "react";

// interface Controlled {
//     value: string,
//     onChange: (value: string) => void,
// }

// interface UnControlled {
//     defaultValue: string,
//     onChange?: (value: string) => void,
// }

export type FileTextFieldProps = Pick<TextFieldProps, 'onChange' | 'inputRef'> & {
    defaultValue?: string,
    value?: string,
    readOnly?: boolean,
    // onChange?: (value: string) => void,
    // inputRef?: React.Ref<HTMLInputElement>,
};

export default ({defaultValue, value, onChange, inputRef, readOnly=false}: FileTextFieldProps) => {

    const [curValue, setCurValue] = useState<string>(value || defaultValue || '');

    useEffect(() => {
        if(value !== undefined && value != curValue) {
            setCurValue(value);}
    }, [value]);

    const inputFileRef = useRef<HTMLInputElement>(null);

    return <TextField
        required
        variant="standard"
        label="Reference Video File"
        inputRef={inputRef}
        defaultValue={value || defaultValue}
        value={curValue}
        onChange={(evt) => {
            setCurValue(evt.target.value);
            onChange?.(evt);
        }}
        error={curValue === ''}
        InputProps={{
            readOnly,
            disabled: readOnly,
            endAdornment: <InputAdornment position="end">
                    <IconButton
                        onClick={() => inputFileRef.current?.click()}
                    >
                        <VideoFileIcon />
                    </IconButton>
                    <input ref={inputFileRef} type="file" accept="video/*" style={{display: 'none'}} onChange={evt => {
                        // console.log(evt);
                        const {path} = inputFileRef.current?.files?.[0] as any;
                        console.log(path);
                        setCurValue(path);
                        onChange?.({...evt, target: {...evt.target, value: path}});
                        // videoFileInputRef.current!.value = path;
                        // videoFileInputRef.current!.dispatchEvent(new Event('change'));
                    }}/>

                </InputAdornment>
        }}

    />;
}