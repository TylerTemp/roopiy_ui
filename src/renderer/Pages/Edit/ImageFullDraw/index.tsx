import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useCallback, useEffect, useRef, useState } from 'react';
import Typography from '@mui/material/Typography';
import { Format } from '~/Utils/Str';
import { Rect, RectCenterDirection } from '~s/Face';
import { RectScale } from '../Face';
import Style from './index.scss';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';


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
    image: HTMLImageElement
    imageWidth: number
    drawInfos: DrawInfo[]
    showDistance: boolean
}

const TextHeight = (ctx: CanvasRenderingContext2D, text: string): number => {
    const textMetrics = ctx.measureText(text);
    return textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
}

const GenerateCombinations = <T,>(arr: T[]): [T, T][] => {
    const combinations: [T, T][] = [];
    const n = arr.length;

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            combinations.push([arr[i], arr[j]]);
        }
    }

    return combinations;
}

const DrawCanvas = ({nodeWidth, nodeHeight, imageWidth, image, showDistance, drawInfos}: DrawCanvasProps) => {

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
                // console.log(`draw`, drawText, color);
                ctx.fillText(drawText, rectScale.left, rectScale.bottom + ctx.lineWidth + TextHeight(ctx, drawText));
            }
            ctx.stroke();
            ctx.closePath();
        }

        if(showDistance && drawInfos.length >= 2) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'white';
            ctx.fillStyle = 'white';
            ctx.font = "20px serif";
            GenerateCombinations(drawInfos).map(([{rect: rect1}, {rect: rect2}]) => {
                const rectScale1: Rect = RectScale(rect1, nodeWidth / imageWidth);
                const rectScale2: Rect = RectScale(rect2, nodeWidth / imageWidth);
                const rect1CenterX = (rectScale1.left + rectScale1.right) / 2;
                const rect1CenterY = (rectScale1.top + rectScale1.bottom) / 2;
                const rect2CenterX = (rectScale2.left + rectScale2.right) / 2;
                const rect2CenterY = (rectScale2.top + rectScale2.bottom) / 2;

                const lineCenterX = (rect1CenterX + rect2CenterX) / 2;
                const lineCenterY = (rect1CenterY + rect2CenterY) / 2;

                const distance = Math.sqrt((rect1CenterX - rect2CenterX)**2 + Math.pow(rect1CenterY - rect2CenterY, 2));

                ctx.beginPath();
                ctx.moveTo(rect1CenterX, rect1CenterY);
                ctx.lineTo(rect2CenterX, rect2CenterY);
                ctx.fillText(distance.toFixed(2), lineCenterX, lineCenterY);
                ctx.strokeText(distance.toFixed(2), lineCenterX, lineCenterY);
                ctx.stroke();
                ctx.closePath();
            });
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
    }, [image, drawInfos, showDistance]);

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
    const [showDistance, setShowDistance] = useState<boolean>(true);

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

    return <>
        <Box className={Style.container} ref={handleDivWidth} height={nodeWidth > 0 ? canvasResizedHeight: undefined}>
            {nodeWidth > 0 && image !== null && <DrawCanvas showDistance={showDistance} nodeWidth={nodeWidth} nodeHeight={canvasResizedHeight} image={image} imageWidth={width} drawInfos={drawInfos} />}
            {loading && <Box className={Style.loadingContainer}>
                <CircularProgress />
                <Typography variant='caption'>
                    {src}
                </Typography>
            </Box>}
        </Box>
        <FormControlLabel control={<Checkbox checked={showDistance} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setShowDistance(event.target.checked)} />} label="Show Distance" />
    </>
}
