import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <Box
            component="footer"
            sx={{
                py: 2,
                px: 3,
                borderTop: '1px solid',
                borderColor: 'divider',
                textAlign: 'center',
            }}
        >
            <Typography variant="caption" color="text.secondary">
                © {year} Dance Suite. All rights reserved.
            </Typography>
        </Box>
    );
};

export default Footer;