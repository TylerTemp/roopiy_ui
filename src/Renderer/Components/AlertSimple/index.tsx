import Alert from "@mui/material/Alert";
import type { AlertProps } from "@mui/material/Alert/Alert.d";
import Button from "@mui/material/Button";
import { PropsWithChildren } from "react";
import ReplayIcon from '@mui/icons-material/Replay';

interface Params extends Pick<AlertProps, "severity" | "onClose"> {
    onReload?:() => void,
}

export default ({severity, onReload, onClose, children}: PropsWithChildren<Params>) => <Alert 
    severity={severity} 
    onClose={onClose}
    action={onReload
        ? <Button color="inherit" size="small" onClick={onReload}>
            <ReplayIcon />
        </Button>
        : undefined}
>{children}
</Alert>;
