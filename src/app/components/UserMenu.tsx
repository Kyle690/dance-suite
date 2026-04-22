'use client';
import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
} from '@mui/material';
import { Logout, Person, Checklist } from '@mui/icons-material';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import MenuButtons from "@/app/components/layout/MenuButtons";

const UserMenu=()=> {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [ anchorEl, setAnchorEl ] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    await signOut();
    handleClose();
    router.push('/');
  };

  if (!user) return null;

  const userEmail = user.email || '';
  const firstName = user.user_metadata?.first_name || '';
  const lastName = user.user_metadata?.last_name || '';
  const userName = user.user_metadata?.full_name || `${firstName} ${lastName}`.trim() || userEmail;

  const initials = firstName && lastName
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : userName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

  return (
      <>
          <Avatar
              sx={{ width:30,height:30,  bgcolor: 'primary.main' }}
              alt={userName}
              onClick={handleClick}
              aria-controls={open ? 'user-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
          >
              <Typography>
                  {initials}
              </Typography>
          </Avatar>
          <Menu
              anchorEl={anchorEl}
              id="user-menu"
              open={open}
              onClose={handleClose}
              onClick={handleClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
              <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle2">{userName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                      {userEmail}
                  </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => router.push('/scrutineer/profile')}>
                  <ListItemIcon>
                      <Person fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Profile</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => router.push('/scrutineer/competitions')}>
                  <ListItemIcon>
                      <Checklist fontSize={'small'}/>
                  </ListItemIcon>
                  <ListItemText>Competitions</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleSignOut}>
                  <ListItemIcon>
                      <Logout fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Sign Out</ListItemText>
              </MenuItem>
          </Menu>
      </>
  );
}

export default UserMenu;
