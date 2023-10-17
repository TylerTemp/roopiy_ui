import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import RetryErrorSuspense, { RendererProps } from "~/Components/RetryErrorSuspense";
import { FrameFace } from "~s/Types/Edit";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Slider from '@mui/material/Slider';
import { GetRectFromFace, type Rect } from "~s/Face";
import useTheme from "@mui/material/styles/useTheme";
import { CssColorMust } from "~/Components/Theme/Basic";
import Box from "@mui/material/Box";
import TitleProgressLoading, { TitleProgressLoadingProps } from "~/Components/TitleProgressLoading";
import Button from "@mui/material/Button";
import enqueueSnackbar from "~/Utils/enqueueSnackbar";
import GroupDrawer from "./GroupDrawer";
import FrameSwapConfigs from "./FrameSwapConfigs";
import FaceLib, { type FaceLibType } from "./FaceLib";
import Style from "./index.scss";
import ImageFullDraw from "./ImageFullDraw";
import { FrameFacesEdited } from "./Face";


const PickColor = (num: number, colors: CssColorMust[]): CssColorMust => colors[num % colors.length];


interface Vector2 {x: number, y: number}


const RectCenter = ({top, bottom, left, right}: Rect): Vector2 => ({
    x: (top + bottom) / 2,
    y: (left + right) / 2,
});


// interface FrameFaceEdited extends FrameFace {
//     edited: boolean;
// }


interface UpdateFrameFace {
    id: FrameFace['id'],
    groupId?: FrameFace['groupId'],
    faceLibId?: FrameFace['faceLibId'],
}

interface EditPromiseResource {
    frameFaces: FrameFacesEdited[],
    faceLibFaces: FaceLibType[]
}

interface EditRendererProps extends RendererProps<EditPromiseResource> {
    projectFolder: string;
}


const EditRenderer = ({getResource, projectFolder}: EditRendererProps) => {
    const {frameFaces, faceLibFaces} = getResource();

    const [{loading, loadingText, loadingProgress}, setLoading] = useState<TitleProgressLoadingProps>({
        loading: false,
        loadingText: null,
        loadingProgress: -1,
    });

    const [cachedFrameFaces, setCachedFrameFaces] = useState<FrameFacesEdited[]>(frameFaces);
    const [cacheFaceLibFaces, setCacheFaceLibFaces] = useState<FaceLibType[]>(faceLibFaces);

    const [selectedRange, setSelectedRange] = useState<[number, number]>([0, frameFaces.length-1]);
    // const [selectedRange, setSelectedRange] = useState<[number, number]>([100, 130]);
    const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(0);

    const WrapSetSelectedRange = ([new1, new2]: [number, number]) => setSelectedRange(([prev1, prev2]) => {
        if(prev1 !== new1) {
            setSelectedFrameIndex(new1);
        }
        else if (prev2 !== new2) {
            setSelectedFrameIndex(new2);
        }
        return [new1, new2];
    });

    const {filePath: frameFile, faces, width, height} = cachedFrameFaces[selectedFrameIndex];

    const { colorPlattes } = useTheme();

    const [savedKey, setSavedKey] = useState<number>(1);

    const OnSave = () => {
        const bulkChanges = cachedFrameFaces
            .filter(({edited}) => edited)
            .map(({faces: toSaveFaces}) => toSaveFaces.map(({id, groupId, faceLibId}: FrameFace): UpdateFrameFace => ({id, groupId, faceLibId})))
            .flat();

        if(bulkChanges.length === 0) {
            enqueueSnackbar('No changes', 'info');
            return;
        }

        setLoading({
            loading: true,
            loadingText: `Saving ${bulkChanges.length} frame faces...`,
            loadingProgress: 0,
        });

        window.electron.ipcRenderer.Edit.UpdateFrameFaces(projectFolder, bulkChanges, (cur) => {
            // console.log(`callback loading`);
            setLoading(prev => ({
                ...prev,
                loadingText: `Saving ${cur}/${bulkChanges.length} frame faces...`,
                loadingProgress: cur / bulkChanges.length,
            }));
        })
        .then(() => {
            setCachedFrameFaces(prev => prev.map(each => ({...each, edited: false})));
            // console.log(`set loading to false`);
            setLoading({
                loading: false,
                loadingText: null,
                loadingProgress: -1,
            });
            enqueueSnackbar('Saved', 'success');
            setSavedKey(prev => -prev);
        })
        .catch(({message}) => enqueueSnackbar(message, 'error'));
    };

    const onGenerate = () => {
        setLoading({
            loading: true,
            loadingText: `Generating...`,
            loadingProgress: -1,
        });
        window.electron.ipcRenderer.Edit.GenerateProject(projectFolder, (cur, total, content) => {
            setLoading(prev => ({
                ...prev,
                loadingText: content,
                loadingProgress: total > 0? cur / total: -1,
            }));
        })
        .then(filePath => {
            console.log(filePath);
            setLoading({
                loading: false,
                loadingText: null,
                loadingProgress: -1,
            });
            enqueueSnackbar(`Generated: ${filePath}`, 'success');
        })
        .catch(error => {
            console.error(error);
            enqueueSnackbar(error.message, 'error');
            setLoading({
                loading: false,
                loadingText: null,
                loadingProgress: -1,
            });
        });
    };

    // console.log(`loading`, loading);

    return <>
        <FaceLib projectFolder={projectFolder as string} faces={faceLibFaces} onAddFace={newFace => setCacheFaceLibFaces(prev => [...prev, newFace])} />

        <Stack gap={2} className={Style.mainContainer}>
            <ImageFullDraw
                src={`project://${projectFolder}/${frameFile}`}
                width={width}
                height={height}
                drawInfos={faces.map((eachFace: FrameFace) => ({
                    rect: GetRectFromFace(eachFace.face),
                    text: eachFace.faceLibId? `${eachFace.groupId}|${cacheFaceLibFaces.find(each => each.id === eachFace.faceLibId)!.alias}`: `${eachFace.groupId}`,
                    color: PickColor(eachFace.groupId, colorPlattes),
                }))} />
            <Typography variant="caption" className={Style.textCenter}>{frameFile}[{faces.length}]</Typography>

            <GroupDrawer
                height={50}
                lineAt={selectedRange}
                actualHeight={frameFaces[0].height}
                actualWidth={frameFaces[0].width}
                draws={cachedFrameFaces.map(({faces: eachFrameFaces}) =>
                    eachFrameFaces.map(({face, groupId}: FrameFace) => ({
                        vector2: RectCenter(GetRectFromFace(face)),
                        groupId,
                        color: PickColor(groupId, colorPlattes),
                    }))
                )}
            />

            <Slider
                value={selectedRange}
                valueLabelDisplay="auto"
                step={1}
                marks
                min={0}
                max={frameFaces.length-1}
                onChange={(event: Event, newValue: number | number[]) => WrapSetSelectedRange(newValue as [number, number])}
            />

            <GroupDrawer
                // key={`${selectedRange[0]}${selectedRange[1]}`}
                height={50}
                lineAt={[selectedFrameIndex - selectedRange[0]]}
                actualHeight={frameFaces[0].height}
                actualWidth={frameFaces[0].width}
                draws={cachedFrameFaces.slice(selectedRange[0], selectedRange[1] + 1).map(({faces: eachFrameFaces}) =>
                    eachFrameFaces.map(({face, groupId}: FrameFace) => ({
                        vector2: RectCenter(GetRectFromFace(face)),
                        groupId,
                        color: PickColor(groupId, colorPlattes),
                    }))
                )}
            />

            <Slider
                value={selectedFrameIndex}
                valueLabelDisplay="auto"
                step={1}
                marks
                min={selectedRange[0]}
                max={selectedRange[1]}
                onChange={(event: Event, newValue: number | number[]) => setSelectedFrameIndex(newValue as number)}
            />

            <Box>
                <Button onClick={() => setSelectedRange(([_, right]) => ([selectedFrameIndex, right]))}>{"<"}</Button>
                <Button onClick={() => setSelectedRange(([left, _]) => ([left, selectedFrameIndex]))}>{">"}</Button>
            </Box>

            <FrameSwapConfigs
                key={savedKey}
                projectFolder={projectFolder}
                faceLibFaces={cacheFaceLibFaces}
                frameFaces={cachedFrameFaces}
                setFrameFaces={setCachedFrameFaces}
                selectedRange={selectedRange}
                selectedFrameIndex={selectedFrameIndex}
            />

            <Box>
                <Button onClick={() => OnSave()}>Save</Button>
                <Button onClick={() => setCachedFrameFaces(frameFaces)}>Cancel</Button>
                <Button onClick={() => onGenerate()}>Generate</Button>
            </Box>

        </Stack>

        {loading && <Box className={Style.loadingContainer}>
            <TitleProgressLoading
                loading={loading}
                loadingText={loadingText}
                loadingProgress={loadingProgress}
            />
        </Box>}
    </>;
}


export default () => {
    const { projectFolder } = useParams();
    console.assert(projectFolder, 'projectFolder is null');

    const [{loading, loadingText, loadingProgress}, setLoading] = useState<TitleProgressLoadingProps>({
        loading: false,
        loadingText: null,
        loadingProgress: -1,
    });

    const makePromise: () => Promise<EditPromiseResource> = useMemo(() => {
        return () => {
            setLoading({
                loading: true,
                loadingText: 'Loading...',
                loadingProgress: -1,
            });
            return Promise.all([
                window.electron.ipcRenderer.Edit.GetProjectFrameFaces(projectFolder as string, (cur, total) => {
                    setLoading({
                        loading: true,
                        loadingText: `Frame: ${cur}/${total}`,
                        loadingProgress: cur / total,
                    });
                })
                .then((frameFaces): FrameFacesEdited[] => frameFaces.map((eachFrameFaces): FrameFacesEdited => ({
                    ...eachFrameFaces,
                    edited: false,
                }))),
                window.electron.ipcRenderer.Edit.GetAllFacesInFaceLib(projectFolder as string),
            ])
                .then(([frameFaces, faceLibFaces]): EditPromiseResource => ({ frameFaces, faceLibFaces }))
                .finally(() => {
                    setLoading({
                        loading: false,
                        loadingText: null,
                        loadingProgress: -1,
                    });
                });
        }
    }, [projectFolder]);

    useEffect(() => {
        return () => {
            if(projectFolder) {
                window.electron.ipcRenderer.Util.CloseDatabase(projectFolder);
            }
        }
    }, []);

    return <>
        <Typography variant="h1" className={Style.textCenter}>{projectFolder}</Typography>

        <RetryErrorSuspense<EditPromiseResource>
            noTrace
            makePromise={makePromise}
            fallback={<Box className={Style.loadingContainer}>
                <TitleProgressLoading
                    loading={loading}
                    loadingText={loadingText}
                    loadingProgress={loadingProgress}
                />
            </Box>}
            renderer={props => <EditRenderer projectFolder={projectFolder as string} {...props}/>}
        />
    </>;
}
