import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { forwardRef, useRef, useImperativeHandle, useState, useEffect } from "react";

interface SwapGroupProps {
    groupId: number;
    groupIds: number[];
    onToGroupChanged: (groupId: number, oldGroupId: number, newGroupId: number) => void;
}

interface SwapGroupCallbacks {
    // GetSwap: () => [number, number];
    setToGroup: (groupId: number) => void,
}

const SwapGroup = forwardRef<SwapGroupCallbacks, SwapGroupProps>(({groupId, groupIds, onToGroupChanged}: SwapGroupProps, ref) => {

    const [toGroup, setToGroup] = useState<number>(groupId);
    const WrapSetToGroup = (newGroupId: number) => {
        setToGroup(oldGroupdId => {
            onToGroupChanged(groupId, oldGroupdId, newGroupId);
            return newGroupId;
        });
    }

    useImperativeHandle(ref, () => ({
        // GetSwap: () => [0, 0],
        setToGroup,
    }));

    return <Select
        value={toGroup}
        // label="From"
        onChange={({target: {value}}) => {
            const newGroupId = parseInt(value as string, 10);
            if(!Number.isNaN(newGroupId)) {
                WrapSetToGroup(value as number);
            }
        }}
    >
        {groupIds.map((eachGroupId) => <option key={eachGroupId} value={eachGroupId}>{eachGroupId}</option>)}
    </Select>;
});


interface Props {
    allGroupIds: number[];
}

interface NumberKV {
    [key: number]: number;
}


const CreateObjFromArr = (arr: number[]): NumberKV => arr.reduce((o, key) => ({ ...o, [key]: key}), {});


export default ({allGroupIds}: Props) => {

    const [swapGroupMap, setSwapGroupMap] = useState<NumberKV>(CreateObjFromArr(allGroupIds));
    useEffect(() => {
        setSwapGroupMap(CreateObjFromArr(allGroupIds));
    }, [allGroupIds]);

    const setSwapGroup = (groupId: number, newGroupId: number) => {
        setSwapGroupMap(oldMap => {
            const conflictGroupId = oldMap.find();
            const conflictValue = oldMap[groupId];
            console.log(groupId, '->', newGroupId, '|', conflictGroupId, '->', conflictValue);

            const result = {...oldMap, [groupId]: newGroupId, [conflictGroupId]: conflictValue};
            console.log(result);
            return result;
        });
    }

    // const swapGroupCallbacksMapRef = useRef<Map<number, SwapGroupCallbacks> | null>(null);
    // const GetSwapGroupCallbacksMapRef = () => {
    //     if(!swapGroupCallbacksMapRef.current) {
    //         swapGroupCallbacksMapRef.current = new Map();
    //     }
    //     return swapGroupCallbacksMapRef.current;
    // }

    // const onToGroupChanged = (groupId: number, oldGroupId: number, newGroupId: number) => {
    //     const oldRef = GetSwapGroupCallbacksMapRef().get(oldGroupId);
    //     console.assert(oldRef);

    // }

    return <>
        {/* {allGroupIds.map((groupId) => <SwapGroup
            key={groupId}
            // ref={(node) => {
            //     const map = GetSwapGroupCallbacksMapRef();
            //     if(node) {
            //         map.set(groupId, node);
            //     }
            //     else {
            //         map.delete(groupId);
            //     }
            // }}

            groupId={groupId}
            groupIds={allGroupIds}
            // onToGroupChanged={}
            onToGroupChanged={onToGroupChanged}
        />)} */}

        {allGroupIds.map(groupId => <Select
            key={groupId}
            value={swapGroupMap[groupId]}
            label={`${groupId}`}
            onChange={({target: {value}}) => {
                const newGroupId = parseInt(value as string, 10);
                if(!Number.isNaN(newGroupId)) {
                    // WrapSetToGroup(value as number);
                    setSwapGroup(groupId, newGroupId);
                }
            }}
        >
            {allGroupIds.map((eachGroupId) => <MenuItem key={eachGroupId} value={eachGroupId}>{eachGroupId}</MenuItem>)}
        </Select>)}

        {/* {allGroupIds.map((groupId) => <Select
            key={groupId}
            value={groupId}
            // label="From"
            onChange={({target: {value}}) => {
                const newGroupId = parseInt(value as string, 10);
                if(!Number.isNaN(newGroupId)) {
                    // WrapSetToGroup(value as number);
                    setSwapGroup(groupId, newGroupId);
                }
            }}
        >
            {allGroupIds.map((eachGroupId) => <MenuItem key={eachGroupId} value={eachGroupId}>{eachGroupId}</MenuItem>)}
        </Select>)} */}
    </>
}
