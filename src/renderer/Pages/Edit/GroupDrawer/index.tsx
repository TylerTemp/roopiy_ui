import Box from "@mui/material/Box";
import { useCallback, useState } from "react";
import { CssColorMust } from "~/Components/Theme/Basic";
import { clamp } from "~s/Util";
import Style from './index.scss';


const PickColor = (num: number, colors: React.CSSProperties['color'][]): React.CSSProperties['color'] => colors[num % colors.length];


interface Vector2 {
    x: number, y: number
}

interface Draw {
    vector2: Vector2,
    groupId: number,
    color: CssColorMust,
}

interface Props {
    height: number,
    actualHeight: number,
    actualWidth: number,
    lineAt: number[],
    draws: Draw[][]
}

interface DrawCanvasProp extends Props {
    width: number,
}


const DrawCanvas = ({width, height, actualHeight, actualWidth, draws, lineAt}: DrawCanvasProp) => {

    const handleCanvas = useCallback((canvasNode: HTMLCanvasElement) => {
        if(!canvasNode) {
            return;
        }

        const ctx = canvasNode.getContext('2d')!;
        ctx.lineWidth = 1;

        const eachWidth = width / draws.length;

        let maxY = 0;
        let minY = height;
        const scaledDraws: Draw[][] = draws.map((eachDrawGroup, groupIndex) => {
            return eachDrawGroup.map(({vector2: {x, y}, ...left}) => {
                const scaledX = x * eachWidth / actualWidth + groupIndex * eachWidth;
                const scaledY = clamp(y * height / actualHeight, 0, height);
                maxY = Math.max(scaledY, maxY);
                minY = Math.min(scaledY, minY);
                return {
                    ...left,
                    vector2: {
                        x: scaledX,
                        y: scaledY,
                    }
                }
            })
        });

        const filledDraws: Draw[][] = scaledDraws.map(eachDrawGroup => {
            return eachDrawGroup.map(({vector2: {x, y}, ...left}) => {
                const filledY = y - minY + (height - maxY);
                return {
                    ...left,
                    vector2: {
                        x,
                        y: filledY,
                    }
                }
            })
        });

        ctx.clearRect(0, 0, width, height);
        let prevDrawGroupMap: Map<number, Vector2> = new Map<number, Vector2>();
        filledDraws.forEach((eachDrawGroup, eachDrawGroupIndex) => {

            const curDrawGroupMap: Map<number, Vector2> = new Map<number, Vector2>();

            if(lineAt.includes(eachDrawGroupIndex)) {
                ctx.strokeStyle = 'white';
                ctx.fillStyle = 'white';
                ctx.beginPath();

                const x = eachWidth * (eachDrawGroupIndex);
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);

                ctx.moveTo(x + eachWidth, 0);
                ctx.lineTo(x + eachWidth, height);

                ctx.moveTo(x, 0);
                ctx.lineTo(x + eachWidth, 0);

                ctx.moveTo(x, height);
                ctx.lineTo(x + eachWidth, height);

                ctx.stroke();
                ctx.closePath();
            }

            eachDrawGroup.forEach(({vector2, groupId, color}) => {
                const {x, y} = vector2;
                ctx.strokeStyle = color;
                ctx.fillStyle = color;

                const prevVec2: Vector2 | undefined = prevDrawGroupMap.get(groupId);

                ctx.beginPath();

                if(prevVec2 !== undefined) {
                    const {x: prevX, y: prevY} = prevVec2;
                    ctx.moveTo(prevX, prevY);
                    ctx.lineTo(x, y);
                }

                ctx.fillRect(x - 1, y - 1, 3, 3);

                ctx.stroke();

                ctx.closePath();

                curDrawGroupMap.set(groupId, vector2);
            })

            prevDrawGroupMap = curDrawGroupMap;

        });

    }, [draws]);

    return <canvas
        ref={handleCanvas}
        width={width}
        height={height}
    />
}


export default (props: Props) => {
    const {height} = props;
    // const { colorPlattes } = useTheme();

    const [nodeWidth, setNodeWidth] = useState<number>(-1);

    const handleDivWidth = useCallback((canvasNode: HTMLDivElement) => {
        if(canvasNode) {
            const canvasWidth = canvasNode.getBoundingClientRect().width;
            setNodeWidth(canvasWidth);
        }
    }, []);

    return <Box className={Style.container} ref={handleDivWidth} height={height}>
        {nodeWidth > 0 && <DrawCanvas {...props} width={nodeWidth}/>}
    </Box>;
}