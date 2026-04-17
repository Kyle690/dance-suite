import React, { useState } from 'react';
import { HeatType } from "@prisma/client";
import { Card, CardContent, Chip, IconButton, Stack, Typography } from "@mui/material";
import { toLower, startCase } from "lodash";
import { getHeatTypeColor } from "@/app/utils/heatUtils";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";

type HeatCardType = {
    itemNo?:string|null;
    sectionName?:string|null;
    type?:HeatType;
    activeDance?:string;
    onNext?: () => void;
    onPrevious?: () => void;
    totalDances?:string;
};

const HeatCard: React.FC<HeatCardType> = ({
    itemNo,
    sectionName,
    type,
    activeDance,
    totalDances,
    onNext,
    onPrevious,
}) => {


    return (
        <Card
            sx={{
                width:'100%'
            }}
        >
            <CardContent>
                <Stack>
                    <Stack
                        direction={'row'}
                        justifyContent={'space-between'}
                        alignItems={'center'}
                        mb={2}
                    >
                        <Stack>
                            <Typography variant={'h6'}>
                                {startCase(toLower(sectionName as string))}
                            </Typography>
                            <Typography
                                variant={'caption'}
                            >
                                Item {itemNo}
                            </Typography>
                        </Stack>
                        {/*<Typography*/}
                        {/*    variant={'h6'}*/}
                        {/*>*/}
                        {/*    Item {itemNo} - {startCase(toLower(sectionName as string))}*/}
                        {/*</Typography>*/}
                        <Chip
                            label={startCase(toLower(type))}
                            size={'small'}
                            color={getHeatTypeColor(type as HeatType)}
                        />
                    </Stack>
                    <Stack
                        direction={'row'}
                        justifyContent={'space-evenly'}
                    >
                        {/*<IconButton*/}
                        {/*    onClick={onPrevious}*/}
                        {/*    disabled={!onPrevious}*/}
                        {/*>*/}
                        {/*    <ChevronLeft/>*/}
                        {/*</IconButton>*/}
                        <Stack
                            alignItems={'center'}
                            justifyContent={'center'}
                        >
                            <Typography variant={'h3'}>
                                {activeDance}
                            </Typography>
                            <Typography
                                variant={'caption'}
                            >
                                {totalDances}
                            </Typography>
                        </Stack>
                        {/*<IconButton*/}
                        {/*    onClick={onNext}*/}
                        {/*    disabled={!onNext}*/}
                        {/*>*/}
                        {/*    <ChevronRight/>*/}
                        {/*</IconButton>*/}
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default HeatCard;
