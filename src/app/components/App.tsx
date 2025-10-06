'use client';
import React, { Suspense } from 'react';
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CssBaseline, LinearProgress } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider as MuiLocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

type AppProps = {
    children: React.ReactNode
}
const queryClient = new QueryClient({

})

const theme = createTheme({
    cssVariables: {
        colorSchemeSelector: 'data-toolpad-color-scheme',
    },
});
const App: React.FC<AppProps> = ({
    children
}) => {
    return (
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
                        <ThemeProvider theme={theme}>
                            <CssBaseline />
                            {children}
                        </ThemeProvider>
                    </MuiLocalizationProvider>
                </SnackbarProvider>
            </QueryClientProvider>
        </Suspense>
    );
}

export default App;
