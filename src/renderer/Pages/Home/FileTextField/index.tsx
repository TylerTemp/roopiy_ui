import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import VideoFileIcon from '@mui/icons-material/VideoFile';
import { useEffect, useRef, useState } from "react";

// interface Controlled {
//     value: string,
//     onChange: (value: string) => void,
// }

// interface UnControlled {
//     defaultValue: string,
//     onChange?: (value: string) => void,
// }

export type FileTextFieldProps = Pick<TextFieldProps, 'onChange' | 'inputRef'> & {
    // eslint-disable-next-line react/require-default-props
    defaultValue?: string,
    // eslint-disable-next-line react/require-default-props
    value?: string,
    // eslint-disable-next-line react/require-default-props
    readOnly?: boolean,
    // onChange?: (value: string) => void,
    // inputRef?: React.Ref<HTMLInputElement>,
};

export default ({defaultValue, value, onChange, inputRef, readOnly=false}: FileTextFieldProps) => {

    const [curValue, setCurValue] = useState<string>(value || defaultValue || '');

    // console.log('FileTextField', curValue, value);

    useEffect(() => {
        if(value !== undefined && value !== curValue) {
            setCurValue(value);}
    }, [value]);

    const inputFileRef = useRef<HTMLInputElement>(null);

    return <TextField
        required
        fullWidth
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
                        const {path=''} = inputFileRef.current?.files?.[0] as any || {};
                        console.log(path);
                        setCurValue(path);
                        // if(path !== '') {

                        // }
                        onChange?.({...evt, target: {...evt.target, value: path}});
                        // videoFileInputRef.current!.value = path;
                        // videoFileInputRef.current!.dispatchEvent(new Event('change'));
                    }}/>

                </InputAdornment>
        }}

    />;
}
