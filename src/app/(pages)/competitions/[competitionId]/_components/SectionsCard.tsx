import React from 'react';
import { Button, Card, CardContent, CardHeader } from "@mui/material";
import MenuButtons from "@/app/components/layout/MenuButtons";
import { AddCircle } from "@mui/icons-material";

type SectionsCardProps = {}

const SectionsCard: React.FC<SectionsCardProps> = () => {
    return (
        <Card>
            <CardHeader
                action={(
                    <Button
                        size={'small'}
                        variant={'contained'}
                        color={'primary'}
                        startIcon={<AddCircle color={'inherit'} />}
                    >
                        Add Section
                    </Button>
                )}
            />
            <CardContent>

            </CardContent>
        </Card>
    );
}

export default SectionsCard;
