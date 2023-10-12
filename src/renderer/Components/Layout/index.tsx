import {  NavLink, Outlet, useLocation, useParams } from 'react-router-dom';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import { useContext, useRef, useState } from 'react';
import { Context, ThemeType } from "~/Components/Theme/ThemeProvider";
// import Style from "./index.css";
import HomeTwoToneIcon from '@mui/icons-material/HomeTwoTone';
import BusinessTwoToneIcon from '@mui/icons-material/BusinessTwoTone';
import HelpTwoToneIcon from '@mui/icons-material/HelpTwoTone';
import SentimentSatisfiedTwoToneIcon from '@mui/icons-material/SentimentSatisfiedTwoTone';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import RotateStyle from "~/Components/RotateClass/index.css";
// import { useTheme } from '@mui/material';
import classNames from 'classnames';
import useTheme from '@mui/material/styles/useTheme';
import LinearProgress from '@mui/material/LinearProgress';
import Style from "./index.css";
import DarkLightToggle from './DarkLightToggle';

export const StyleContentMarginNoTop = Style.contentMarginNoTop;

export const StyleSticky = Style.sticky;

export const TopLinearProgress = () => <div className={Style.topLoader}>
    <LinearProgress />
</div>;


export default () => {

    const {theme, setTheme} = useContext(Context);

    const curTheme = useTheme();

    // const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);

    // const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    //   setAnchorElNav(event.currentTarget);
    // };

    // const handleCloseNavMenu = () => {
    //   setAnchorElNav(null);
    // };

    // const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [openCompany, setOpenCompany] = useState<boolean>(false);

    const companyElRef = useRef<HTMLButtonElement>(null);

    const {pathname} = useLocation();
    let selected = 'home';
    if(pathname.startsWith('/unindexed')) {
        selected = 'unindexed';
    } else if(pathname.startsWith('/model')) {
        selected = 'model';
    } else if(pathname.startsWith('/company')) {
        selected = 'company';
    }
    const {companyName=null} = useParams();

    return <>
        <AppBar>
            <Container maxWidth={false}>
                <Toolbar disableGutters>
                    <Box
                        sx={{ flexGrow: 1,
                        // display: { xs: 'none', md: 'flex' }
                        }}
                    >
                        <NavLink to="/">
                            <Button
                                sx={{ color: selected.includes('home')? curTheme.nav.active : 'white' }}
                                startIcon={<HomeTwoToneIcon />}
                            >
                            Home
                            </Button>
                        </NavLink>
                    </Box>
                    <Box sx={{ flexGrow: 0 }}>
                        <DarkLightToggle isDark={theme === ThemeType.Dark} onChange={toDark => setTheme(toDark? ThemeType.Dark: ThemeType.Light)} />
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
        <div className={Style.content}>
            <div className={Style.relative}>
                <Container maxWidth="xl">
                    <Outlet />
                </Container>
            </div>
        </div>

    </>;
};
