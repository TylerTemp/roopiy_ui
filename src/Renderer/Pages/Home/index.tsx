import { useState } from "react";

export default () => {

    const [echo, setEcho] = useState('');

    const replied = window.electron.ipcRenderer.invoke('echo', 'a message from the renderer process', 'a second argument')
        .then(setEcho);

    return <>
        hi, {echo}
    </>;
}
