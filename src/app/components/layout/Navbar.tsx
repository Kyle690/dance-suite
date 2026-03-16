'use client';

import React from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Divider,
} from '@mui/material';
import { EmojiEvents } from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import UserMenu from '@/app/components/UserMenu';
import ThemeToggleButton from '@/app/components/layout/ThemeToggleButton';

const NAV_LINKS = [
    { label: 'Competitions', href: '/scrutineer/competitions' },
];

const Navbar = () => {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                bgcolor: 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider',
                color: 'text.primary',
            }}
        >
            <Toolbar sx={{ gap: 1 }}>
                {/* Brand */}
                <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mr: 3 }}
                    onClick={() => router.push('/')}
                >
                    <EmojiEvents sx={{ color: 'secondary.main', fontSize: 22 }} />
                    <Typography
                        variant="h6"
                        fontWeight={600}
                        sx={{ whiteSpace: 'nowrap' }}
                    >
                        Dance Suite
                    </Typography>
                </Box>

                {/*/!* Nav links *!/*/}
                {/*{NAV_LINKS.map((link) => (*/}
                {/*    <Button*/}
                {/*        key={link.href}*/}
                {/*        size="small"*/}
                {/*        onClick={() => router.push(link.href)}*/}
                {/*        sx={{*/}
                {/*            color: pathname.startsWith(link.href)*/}
                {/*                ? 'secondary.main'*/}
                {/*                : 'text.secondary',*/}
                {/*            fontWeight: pathname.startsWith(link.href) ? 600 : 400,*/}
                {/*        }}*/}
                {/*    >*/}
                {/*        {link.label}*/}
                {/*    </Button>*/}
                {/*))}*/}

                <Box sx={{ flex: 1 }} />

                <ThemeToggleButton />
                <UserMenu />
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
