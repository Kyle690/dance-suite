'use client';
import React, { Suspense } from 'react';
import { ThemeProvider } from "@mui/material";
import theme from "@/app/theme";
import { CssBaseline, LinearProgress, Box } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider as MuiLocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

type AppProps = {
    children: React.ReactNode
}
const queryClient = new QueryClient({

})

const App: React.FC<AppProps> = ({
    children
}) => {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Suspense fallback={<LinearProgress />}>
                <QueryClientProvider client={queryClient}>
                    <SnackbarProvider
                        anchorOrigin={{
                            vertical:'top',
                            horizontal:'right',
                        }}
                        autoHideDuration={3000}
                    >
                        <MuiLocalizationProvider
                            dateAdapter={AdapterDayjs}
                            adapterLocale={'en-gb'}
                        >
                            {children}
                        </MuiLocalizationProvider>
                    </SnackbarProvider>
                </QueryClientProvider>
            </Suspense>
        </ThemeProvider>
    );
}

export default App;
