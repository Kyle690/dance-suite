'use client';

import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useColorScheme } from '@mui/material/styles';

const ThemeToggleButton = () => {
    const { mode, setMode } = useColorScheme();

    const toggle = () => setMode(mode === 'dark' ? 'light' : 'dark');

    return (
        <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
            <IconButton onClick={toggle} size="small" color="inherit">
                {mode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            </IconButton>
        </Tooltip>
    );
};

export default ThemeToggleButton;