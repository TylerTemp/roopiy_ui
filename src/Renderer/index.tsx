import ReactDOM from 'react-dom/client'
import React from "react";
import { createRoot } from "react-dom/client";

import ErrorBoundary from '~/Components/ErrorBoundary'
import ThemeProvider from '~/Components/Theme/ThemeProvider'
import { CssBaseline } from '@mui/material'
import ToastContainer from '~/Components/ToastContainer'
import { HelmetProvider } from 'react-helmet-async'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '~/Components/Layout'

import NotFound from '~/Pages/NotFound'

// import App from "./components/App";

// const rootElement = document.getElementById("root");
// const root = createRoot(rootElement!);
// root.render(<>?????</>);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<>
    <ThemeProvider>
        <CssBaseline />
        <ErrorBoundary>
            <ToastContainer />
            <Router>
                <HelmetProvider>
                    <Routes>
                        <Route path="/" element={<Layout />}>
                            {/* <Route index element={<Home />} /> */}
                            <Route path="*" element={<NotFound />} />
                        </Route>
                    </Routes>
                </HelmetProvider>
            </Router>
        </ErrorBoundary>
    </ThemeProvider>
</>);
