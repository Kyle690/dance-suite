import React, { useState } from 'react';
import { Card, CardContent, Stack, Typography, CardActionArea } from "@mui/material";
import { startCase, toLower } from "lodash";
import { ArrowForward } from "@mui/icons-material";
import { HeatType } from "@prisma/client";

type SectionCardType = {
    uid:string,
    item_no:string,
    sectionName?:string|null,
    type:HeatType,
    disabled?:boolean,
    onClick?:()=>void,
};
const HeatCard: React.FC<SectionCardType> = ({
    uid,
    item_no,
    sectionName,
    type,
    disabled,
    onClick,
}) => {
    const [ state, setState ] = useState();

    return (
        <Card
            key={uid}
            sx={{
                backgroundColor: disabled ? 'action.disabledBackground' : 'background.paper',
            }}
        >
            <CardActionArea
                onClick={onClick}
                disabled={disabled}
            >
                <CardContent>
                    <Stack
                        direction={'row'}
                        alignItems={'center'}
                        justifyContent={'space-between'}
                    >
                        <Stack
                            direction={'row'}
                            alignItems={'center'}
                            spacing={2}
                        >
                            <Stack
                                sx={{
                                    py:2,
                                    px:3,
                                    alignItems:'center',
                                    justifyContent:'center',
                                    border:'1px solid',
                                    borderRadius:2,
                                }}
                            >
                                <Typography color={disabled ? 'text.disabled' : 'text.primary'} variant={'h5'}>
                                    {item_no}
                                </Typography>
                            </Stack>
                            <Stack>
                                <Typography variant={'h6'} color={disabled ? 'text.disabled' : 'text.primary'}>
                                    {startCase(toLower(String(sectionName)))}
                                </Typography>
                                <Typography color={'text.secondary'}>
                                    {startCase(toLower(type))}
                                </Typography>
                            </Stack>
                        </Stack>
                        <ArrowForward color={disabled ? 'disabled' : 'inherit'}/>
                    </Stack>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default HeatCard;
