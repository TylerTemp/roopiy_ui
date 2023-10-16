import { useEffect } from "react";

export default () => {

    useEffect(() => {

        let isCtrl = false;

        const ctrlCheck = (e: KeyboardEvent): void => {
            if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
                isCtrl = e.type === 'keydown';
            }
        }

        const wheelCheck = (e: WheelEvent): void => {
          // `delta` will be the distance that the page would have scrolled;
          // might be useful for increasing the SVG size, might not
            if (isCtrl) {
                e.preventDefault();
                // console.log(e.deltaY);
                window.electron.ipcRenderer.WebFrame.setZoomOffset(- e.deltaY / 1000);
                // yourResizeMethod(e.deltaY); // Assuming you have a `yourResizeMethod` function
            }
        }

        document.addEventListener('keydown', ctrlCheck);
        document.addEventListener('keyup', ctrlCheck);
        document.addEventListener('wheel', wheelCheck, { passive: false });

        return () => {
            document.removeEventListener('keydown', ctrlCheck);
            document.removeEventListener('keyup', ctrlCheck);
            document.removeEventListener('wheel', wheelCheck);
        }

    }, []);

    return <></>;
}
