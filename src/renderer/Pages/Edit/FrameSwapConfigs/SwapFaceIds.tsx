import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { Fragment } from "react";
import Avatar from "@mui/material/Avatar";
import PickColor from "../PickColor";
import { type FaceLibType } from "../FaceLib";
// import { ids } from "webpack";


export interface NumberNullKV {
    [key: number]: number | null;
}



interface Props {
    projectFolder: string;
    allFaces: FaceLibType[];
    checkGroupIds: Map<number, number[]>;
    onSwapChanged: (groupId: number, faceLibId: number | null) => void;
}


export default ({projectFolder, allFaces, checkGroupIds, onSwapChanged}: Props) => {
    return <>
        {[...checkGroupIds.entries()]
            .sort(([key1, _value1], [key2, _value2]) => key1 - key2)
            .map(([groupId, libFaceIds]: [number, number[]]) => {
            const swapFaceIds = checkGroupIds.get(groupId) || [];
            const selectedValue = swapFaceIds.length === 1? swapFaceIds[0].toString(): '';

            return <Fragment key={groupId}>
                {libFaceIds.map(faceId => {
                    const {file, alias} = allFaces.find(each => each.id === faceId)!;
                    return <Fragment key={faceId}>
                        <Avatar key={faceId} src={`project://${projectFolder}/${file}`} /> {alias}
                    </Fragment>;
                })}
                <FormControl>
                    <InputLabel><span style={{ color: PickColor(groupId) }}>{groupId}</span></InputLabel>
                    <Select
                        value={selectedValue}
                        label={`${groupId}`}
                        onChange={({ target: { value } }) => {
                            const newFaceId: number | null = value === ''
                                ? null
                                : parseInt(value as string, 10);
                            onSwapChanged(groupId, newFaceId);
                        } }
                    >
                        <MenuItem value="">
                            None
                        </MenuItem>
                        {allFaces.map(({id, file, alias}) => <MenuItem key={id} value={id.toString()}>
                            <Avatar src={`project://${projectFolder}/${file}`} /> {alias}
                        </MenuItem>)}
                    </Select>
                </FormControl>
                {/* <Button>Apply</Button> */}
            </Fragment>;
        })}
    </>
}
