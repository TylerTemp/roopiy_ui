import Box from '@mui/material/Box';
import Style from './index.scss';
import { Rect, RectScale } from '../Face';
import { useCallback, useEffect, useRef, useState } from 'react';

interface DrawInfo {
    key: string,
    rect: Rect,
}


interface Props {
    src: string;
    width: number;
    height: number;
    drawInfos: DrawInfo[];
}

interface Size {
    width: number;
    height: number;
}

export default ({src, width, height, drawInfos}: Props) => {
    // const containerDiv = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [canvasSize, setCanvasSize] = useState<Size | null>(null);

    // useEffect(() => {
    //     const canvasDom = canvasRef.current;
    //     if(canvasDom) {
    //         // const containerWidth = canvasDom.clientWidth;
    //         // const containerHeight = canvasDom.clientHeight;
    //         setCanvasSize({
    //             width: canvasDom.clientWidth,
    //             height: canvasDom.clientHeight,
    //         })
    //     }
    // }, [canvasRef.current]);
    const handleCanvas = useCallback((canvasNode: HTMLCanvasElement) => {
        if(canvasNode) {
            canvasRef.current = canvasNode;
            const canvasWidth = canvasNode.clientWidth;
            const canvasResizedHeight = canvasWidth / width * height;

            console.log(`canvas width: ${canvasWidth}, height: ${canvasResizedHeight} by`, width, height);

            setCanvasSize({
                width: canvasWidth,
                height: canvasResizedHeight,
            });

            const ctx = canvasNode.getContext('2d')!;
            console.assert(ctx !== null, 'ctx is null');
            ctx.clearRect(0, 0, canvasWidth, canvasResizedHeight);

            const image = new Image();
            image.src = src;
            image.onload = () => {
                ctx.drawImage(image, 0, 0, canvasWidth, canvasResizedHeight);
            }

            ctx.beginPath();
            ctx.lineWidth = 7;
            ctx.fillStyle = 'yellow';
            ctx.strokeStyle = 'black';
            for (let drawIndex = 0; drawIndex < drawInfos.length; drawIndex+=1) {
                const {rect} = drawInfos[drawIndex];

                const rectScale = RectScale(rect, height / width);
                ctx.rect(rectScale.left, rectScale.top, rectScale.right - rectScale.left, rectScale.bottom - rectScale.top);
                // ctx.rect(0, 0, canvasWidth, canvasResizedHeight);
                // ctx.stroke();
                ctx.fill();
                // ctx.fillRect(rectScale.left, rectScale.top, rectScale.right - rectScale.left, rectScale.bottom - rectScale.top);
            }
        }
    }, []);

    // useEffect(() => {
    //     const OnHandleCanvas = () => {
    //         if(canvasRef.current) {
    //             handleCanvas(canvasRef.current);
    //         }
    //     }

    //     window.addEventListener('resize', OnHandleCanvas);
    //     return () => {
    //         window.removeEventListener('resize', OnHandleCanvas);
    //     }
    // }, []);

    return <canvas
        ref={handleCanvas}
        className={Style.full}
        // style={canvasSize === null? undefined: {
        //     width: `${canvasSize.width}px`,
        //     height: `${canvasSize.height}px`,
        // }}
        // width={canvasSize?.width}
        height={canvasSize?.height}
    />;

    // useEffect(() => {
    //     const scrollCurrent = containerDiv.current;
    //     if(scrollCurrent) {
    //         const containerWidth = scrollCurrent.clientWidth;
    //         const containerHeight = scrollCurrent.clientHeight;

    //     }
    // }, [containerDiv.current]);

    // return <Box className={Style.full} ref={containerDiv}>

    // </Box>
}
