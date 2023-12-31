import ReactDOM from 'react-dom/client'
// import React from "react";
// import { createRoot } from "react-dom/client";

import ErrorBoundary from '~/Components/ErrorBoundary'
import ThemeProvider from '~/Components/Theme/ThemeProvider'
import { CssBaseline } from '@mui/material'
import ToastContainer from '~/Components/ToastContainer'
import { HelmetProvider } from 'react-helmet-async'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '~/Components/Layout'

import Home from '~/Pages/Home'
import Edit from '~/Pages/Edit'
import NotFound from '~/Pages/NotFound'

import CtrlWheelZoom from '~/Components/CtrlWheelZoom'

// import App from "./components/App";

// const rootElement = document.getElementById("root");
// const root = createRoot(rootElement!);
// root.render(<>?????</>);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<ThemeProvider>
        <CssBaseline />
        <ErrorBoundary>
            <CtrlWheelZoom />
            <ToastContainer />
            <Router>
                <HelmetProvider>
                    <Routes>
                        <Route path="/" element={<Layout />}>
                            <Route index element={<Home />} />
                            <Route path="edit/:projectFolder" element={<Edit />} />
                            <Route path="*" element={<NotFound />} />
                        </Route>
                    </Routes>
                </HelmetProvider>
            </Router>
        </ErrorBoundary>
    </ThemeProvider>);
