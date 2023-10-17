import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { useState, useEffect } from "react";
import PickColor from "../PickColor";


export interface NumberKV {
    [key: number]: number;
}



interface Props {
    allGroupIds: number[];
    checkGroupIds: number[];
    onSwapChanged: (swap: NumberKV) => void;
}



const CreateObjFromArr = (arr: number[]): Map<number, number> => new Map<number, number>(arr.map(each => [each, each]));


export default ({allGroupIds, checkGroupIds, onSwapChanged}: Props) => {

    const [swapGroupMap, setSwapGroupMap] = useState<Map<number, number>>(CreateObjFromArr(checkGroupIds));
    useEffect(() => {
        setSwapGroupMap(CreateObjFromArr(checkGroupIds));
    }, [checkGroupIds]);

    const setSwapGroup = (groupId: number, newGroupId: number) => {
        setSwapGroupMap((oldMap): Map<number, number> => {
            const conflictInfo = [...oldMap.entries()].find(([_key, value]) => value === newGroupId);
            if(conflictInfo === undefined) {
                const newMap = new Map<number, number>(oldMap.entries());
                newMap.set(groupId, newGroupId);
                onSwapChanged(Object.fromEntries([...newMap.entries()].filter(([key, value]) => key !== value)));
                return newMap;
            }

            const [conflictGroupId, _] = conflictInfo;
            const conflictValue = oldMap.get(groupId);
            console.log(groupId, '->', newGroupId, '|', conflictGroupId, '->', conflictValue);

            const newMap = new Map<number, number>(oldMap.entries());
            newMap.set(groupId, newGroupId);
            newMap.set(conflictGroupId, conflictValue!);

            onSwapChanged(Object.fromEntries([...newMap.entries()].filter(([key, value]) => key !== value)));

            return newMap;
        });
    }


    return <>
        {checkGroupIds.map(groupId => {
            // console.log(`groupId: ${groupId} get`, swapGroupMap.get(groupId));
            const swapGroupId = swapGroupMap.get(groupId) || allGroupIds[0];
            return <FormControl
                key={groupId}
            >
                <InputLabel><span style={{ color: PickColor(groupId) }}>{groupId}</span></InputLabel>
                <Select
                    value={swapGroupId}
                    label={`${groupId}`}
                    onChange={({ target: { value } }) => {
                        const newGroupId = parseInt(value as string, 10);
                        if (!Number.isNaN(newGroupId)) {
                            // WrapSetToGroup(value as number);
                            setSwapGroup(groupId, newGroupId);
                        }
                    } }
                >
                    {allGroupIds.map((eachGroupId) => <MenuItem key={eachGroupId} value={eachGroupId}>
                        <span style={{ color: PickColor(eachGroupId) }}>{eachGroupId}</span>
                    </MenuItem>)}
                </Select>
            </FormControl>;
        })}
    </>
}
