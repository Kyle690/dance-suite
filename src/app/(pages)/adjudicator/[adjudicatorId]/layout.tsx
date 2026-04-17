'use client';
import React, { useState } from 'react';
import { useSession } from "next-auth/react";
import {
    AppBar,
    Avatar,
    Box, Card, CardContent,
    Container,
    Divider,
    ListItemIcon, ListItemText, Menu,
    MenuItem,
    Stack,
    Toolbar,
    Typography
} from "@mui/material";
import { signOut } from "next-auth/react";
import { EmojiEvents, Logout, Person } from "@mui/icons-material";

type layoutType = {
    children: React.ReactNode;
};
const Layout: React.FC<layoutType> = ({
    children
}) => {


    const session = useSession();

    const [ anchorEl, setAnchorEl ] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSignOut = async()=>{
        await signOut()
    }
    const initials = session.data?.user?.name?.[0] ||'-'

    return (
        <Container maxWidth={'md'} sx={{ p:0 }}>
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    bgcolor: 'background.paper',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    color: 'text.primary',
                    width:'100%'
                }}
            >
                <Toolbar>
                    <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mr: 3 }}
                        //onClick={() => router.push('/')}
                    >
                        <EmojiEvents sx={{ color: 'secondary.main', fontSize: 22 }} />
                        <Stack>
                            <Typography
                                variant="h6"
                                fontWeight={600}
                                sx={{ whiteSpace: 'nowrap' }}
                            >
                                Dance Suite
                            </Typography>
                            <Typography variant={'caption'}>
                                Adjudicator Portal
                            </Typography>
                        </Stack>
                    </Box>
                    <Box sx={{ flex: 1 }} />
                    <Stack
                        direction={'row'}
                        alignItems={'center'}
                        spacing={2}
                    >
                        <Avatar
                            sx={{ width:30,height:30,  bgcolor: 'primary.main' }}
                            alt={String(session.data?.user?.name)}
                            onClick={handleClick}
                            aria-controls={open ? 'user-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={open ? 'true' : undefined}
                        >
                            <Typography
                                sx={{
                                    textTransform:'uppercase'
                                }}
                            >
                                {initials}
                            </Typography>
                        </Avatar>
                    </Stack>
                    <Menu
                        anchorEl={anchorEl}
                        id="user-menu"
                        open={open}
                        onClose={handleClose}
                        onClick={handleClose}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        <MenuItem onClick={handleSignOut}>
                            <ListItemIcon>
                                <Logout fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Sign Out</ListItemText>
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>
            <Stack
                mx={{
                    xs:2,
                    sm:2,
                    md:3
                }}
            >
                {children}
            </Stack>
        </Container>
    );
};

export default Layout;
