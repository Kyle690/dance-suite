'use client';
import React, { useMemo } from 'react';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, SvgIconProps, ThemedProps, Button } from "@mui/material";
import { MoreVert } from "@mui/icons-material";

type MaterialColors = 'primary'|'secondary'|'error'|'warning'|'info'|'success';

export type MenuButtonsProps = {
    name:string;
    id:string;
    disabled?:boolean;
    menuIconSize?:'small'|'medium'|'large';
    menuName?:string;
    buttons: {
        label:string,
        onClick?:()=>void,
        href?:string,
        href_target?:'_blank' | '_self',
        icon:React.ReactNode,
        color?:MaterialColors,
        disabled?:boolean,
        id?:string
    }[]
}

const MenuButtons: React.FC<MenuButtonsProps> = ({
    name,
    id,
    buttons,
    menuIconSize = 'medium',
    disabled = false,
    menuName,
}) => {

    const [ menuAnchorEl, setMenuAnchorEl ] = React.useState<{ anchorEl:HTMLElement, id:string}|null>(null);


    const { user }={ user:null }
    //const userPermissions = String(user?.publicMetadata?.permissions)?.split(',') || [];
    const userPermissions:string[] = [];

    const filteredButtons = useMemo(()=>{
        if(!buttons || buttons.length === 0) return [];

        return buttons.filter((button)=>{

            // if(button?.id){
            //     return userPermissions.includes(button.id);
            // }
            return button;
        })


    },[ buttons, userPermissions ]);

    return (
        <div>
            {Boolean(menuName)?(
                <Button
                    size={menuIconSize}
                    onClick={(e)=>{
                        setMenuAnchorEl({
                            anchorEl:e.currentTarget,
                            id:id
                        })
                    }}
                    aria-haspopup={true}
                    aria-controls={name+'-menu'}
                    disabled={disabled}
                >
                    {menuName}
                </Button>
            ):(
                <IconButton
                    size={menuIconSize}
                    onClick={(e)=>{
                        setMenuAnchorEl({
                            anchorEl:e.currentTarget,
                            id:id
                        })
                    }}
                    aria-haspopup={true}
                    aria-controls={name+'-menu'}
                    disabled={disabled}
                >
                    <MoreVert/>
                </IconButton>
            )}
            <Menu
                id={name+'-menu'}
                open={Boolean(menuAnchorEl?.id === id)}
                anchorEl={menuAnchorEl?.anchorEl}
                onClose={()=>setMenuAnchorEl(null)}
            >
                {filteredButtons?.map((button)=>{

                    return (
                        <MenuItem
                            key={button.label}
                            onClick={()=>{
                                button?.onClick?.();
                                setMenuAnchorEl(null);
                            }}
                            component={button?.href ? 'a' : 'button'}
                            href={button?.href}
                            disabled={button.disabled}
                            target={button?.href_target}
                        >
                            {!!button.icon && (
                                <ListItemIcon>
                                    {button.icon}
                                </ListItemIcon>
                            )}
                            <ListItemText color={button.color}>
                                {button?.label}
                            </ListItemText>
                        </MenuItem>
                    )})}
                {filteredButtons?.length ===0 && (
                    <MenuItem
                        disabled
                    >
                        No options available
                    </MenuItem>
                )}
            </Menu>
        </div>
    );
}

export default MenuButtons;
