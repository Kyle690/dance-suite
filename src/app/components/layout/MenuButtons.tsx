'use client';
import React, { useMemo } from 'react';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Button, Divider, ListSubheader } from "@mui/material";
import { MoreVert } from "@mui/icons-material";

type MaterialColors = 'primary'|'secondary'|'error'|'warning'|'info'|'success';

type MenuItemEntry = {
    type?: 'item';
    label: string;
    onClick?: () => void;
    href?: string;
    href_target?: '_blank' | '_self';
    icon: React.ReactNode;
    color?: MaterialColors;
    disabled?: boolean;
    id?: string;
};

type DividerEntry = {
    type: 'divider';
};

type SubheaderEntry = {
    type: 'subheader';
    label: string;
};

export type MenuEntry = MenuItemEntry | DividerEntry | SubheaderEntry;

export type MenuButtonsProps = {
    name: string;
    id: string;
    disabled?: boolean;
    menuIconSize?: 'small' | 'medium' | 'large';
    menuName?: string;
    buttons: MenuEntry[];
}

const MenuButtons: React.FC<MenuButtonsProps> = ({
    name,
    id,
    buttons,
    menuIconSize = 'medium',
    disabled = false,
    menuName,
}) => {

    const [ menuAnchorEl, setMenuAnchorEl ] = React.useState<{ anchorEl: HTMLElement, id: string } | null>(null);

    const userPermissions: string[] = [];

    const filteredButtons = useMemo(() => {
        if (!buttons || buttons.length === 0) return [];
        return buttons.filter((button) => button);
    }, [ buttons, userPermissions ]);

    const hasItems = filteredButtons.some((b) => !b.type || b.type === 'item');

    return (
        <div>
            {Boolean(menuName) ? (
                <Button
                    size={menuIconSize}
                    onClick={(e) => {
                        setMenuAnchorEl({ anchorEl: e.currentTarget, id });
                    }}
                    aria-haspopup={true}
                    aria-controls={name + '-menu'}
                    disabled={disabled}
                >
                    {menuName}
                </Button>
            ) : (
                <IconButton
                    size={menuIconSize}
                    onClick={(e) => {
                        setMenuAnchorEl({ anchorEl: e.currentTarget, id });
                    }}
                    aria-haspopup={true}
                    aria-controls={name + '-menu'}
                    disabled={disabled}
                >
                    <MoreVert />
                </IconButton>
            )}
            <Menu
                id={name + '-menu'}
                open={Boolean(menuAnchorEl?.id === id)}
                anchorEl={menuAnchorEl?.anchorEl}
                onClose={() => setMenuAnchorEl(null)}
            >
                {filteredButtons.map((entry, index) => {
                    if (entry.type === 'divider') {
                        return <Divider key={`divider-${index}`} />;
                    }

                    if (entry.type === 'subheader') {
                        return (
                            <ListSubheader
                                key={`subheader-${index}`}
                                sx={{ lineHeight: '32px', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                            >
                                {entry.label}
                            </ListSubheader>
                        );
                    }

                    return (
                        <MenuItem
                            key={entry.label}
                            onClick={() => {
                                entry?.onClick?.();
                                setMenuAnchorEl(null);
                            }}
                            component={entry?.href ? 'a' : 'button'}
                            href={entry?.href}
                            disabled={entry.disabled}
                            target={entry?.href_target}
                        >
                            {!!entry.icon && (
                                <ListItemIcon>
                                    {entry.icon}
                                </ListItemIcon>
                            )}
                            <ListItemText>
                                {entry.label}
                            </ListItemText>
                        </MenuItem>
                    );
                })}
                {!hasItems && (
                    <MenuItem disabled>
                        No options available
                    </MenuItem>
                )}
            </Menu>
        </div>
    );
}

export default MenuButtons;
