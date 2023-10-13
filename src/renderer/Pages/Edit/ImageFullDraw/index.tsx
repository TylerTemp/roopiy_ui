import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useCallback, useEffect, useRef, useState } from 'react';
import Typography from '@mui/material/Typography';
import { Format } from '~/Utils/Str';
import { Rect, RectScale } from '../Face';
import Style from './index.scss';


interface DrawInfo {
    rect: Rect,
    text: string | null,
    color?: string | undefined,
}

interface NodeSizeInfoProps {
    nodeWidth: number;
    nodeHeight: number;
}

interface DrawCanvasProps extends NodeSizeInfoProps {
    image: HTMLImageElement;
    imageWidth: number,
    drawInfos: DrawInfo[];
}

const TextHeight = (ctx: CanvasRenderingContext2D, text: string): number => {
    const textMetrics = ctx.measureText(text);
    return textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
}


const DrawCanvas = ({nodeWidth, nodeHeight, imageWidth, image, drawInfos}: DrawCanvasProps) => {

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const renderCanvasInfo = (canvasNode: HTMLCanvasElement) => {
        const ctx = canvasNode.getContext('2d')!;
        console.assert(ctx !== null, 'ctx is null');
        // ctx.clearRect(0, 0, nodeWidth, nodeHeight);
        ctx.clearRect(0, 0, canvasNode.width, canvasNode.height);
        // ctx.fillStyle = 'yellow';
        // ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 5;
        ctx.font = "48px serif";

        ctx.drawImage(image, 0, 0, nodeWidth, nodeHeight);

        for (let drawIndex = 0; drawIndex < drawInfos.length; drawIndex+=1) {
            ctx.beginPath();

            const {rect, text, color='yellow'} = drawInfos[drawIndex];

            ctx.strokeStyle = color;
            ctx.fillStyle = color;

            const rectScale: Rect = RectScale(rect, nodeWidth / imageWidth);
            ctx.rect(rectScale.left, rectScale.top, rectScale.right - rectScale.left, rectScale.bottom - rectScale.top);

            if(text !== null) {
                const drawText: string = Format(text, {'index': drawIndex.toString()});
                console.log(`draw`, drawText, color);
                ctx.fillText(drawText, rectScale.left, rectScale.bottom + ctx.lineWidth + TextHeight(ctx, drawText));
            }
            ctx.stroke();
            ctx.closePath();
        }

    }

    const handleCanvas = useCallback((canvasNode: HTMLCanvasElement) => {
        if(canvasNode) {
            canvasRef.current = canvasNode;
            renderCanvasInfo(canvasNode);
        }
    }, []);

    useEffect(() => {
        if(canvasRef.current) {
            renderCanvasInfo(canvasRef.current);
        }
    }, [image, drawInfos]);

    return <canvas className={Style.canvas} ref={handleCanvas} width={nodeWidth} height={nodeHeight} />
}


interface Props {
    src: string;
    width: number;
    height: number;
    drawInfos: DrawInfo[];
}



export default ({src, width, height, drawInfos}: Props) => {

    const [loading, setLoading] = useState<boolean>(true);
    const [nodeWidth, setNodeWidth] = useState<number>(-1);
    const [image, setImage] = useState<HTMLImageElement | null>(null);

    const handleDivWidth = useCallback((canvasNode: HTMLDivElement) => {
        if(canvasNode) {
            const canvasWidth = canvasNode.getBoundingClientRect().width;
            // const canvasResizedHeight = canvasWidth * height / width;

            setNodeWidth(canvasWidth);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        const newImage = new Image();
        newImage.src = src;
        newImage.onload = () => {
            setImage(newImage);
            setLoading(false);
        }
    }, [src]);

    const canvasResizedHeight = nodeWidth * height / width;

    return <Box className={Style.container} ref={handleDivWidth} height={nodeWidth > 0 ? canvasResizedHeight: undefined}>
        {nodeWidth > 0 && image !== null && <DrawCanvas nodeWidth={nodeWidth} nodeHeight={canvasResizedHeight} image={image} imageWidth={width} drawInfos={drawInfos} />}
        {loading && <Box className={Style.loadingContainer}>
            <CircularProgress />
            <Typography variant='caption'>
                {src}
            </Typography>
        </Box>}
    </Box>
}
