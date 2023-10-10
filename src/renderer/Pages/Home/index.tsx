import { useState } from "react";

export default () => {

    const [echo, setEcho] = useState('');

    window.electron.ipcRenderer.invoke('project', 'list')
        .then(setEcho);

    return <>
        hi, {echo}
    </>;
}
