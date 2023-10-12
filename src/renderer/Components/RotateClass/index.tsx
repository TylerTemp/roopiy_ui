// import ReplayTwoToneIcon from '@mui/icons-material/ReplayTwoTone';
// import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import DataUsageIcon from '@mui/icons-material/DataUsage';
// import DonutSmallIcon from '@mui/icons-material/DonutSmall';
import Style from './index.css';

export const {rotateBase} = Style;
export const {rotate90} = Style;
export const {rotateLoopAnimationBaseTime} = Style;
// export const ReloadingIcon = () => <ReplayTwoToneIcon classes={{root: Style.rotateLoopAnimationBaseTime}} />;
export const ReloadingIcon = () => <DataUsageIcon classes={{root: Style.rotateLoopAnimationBaseTime}} />;
