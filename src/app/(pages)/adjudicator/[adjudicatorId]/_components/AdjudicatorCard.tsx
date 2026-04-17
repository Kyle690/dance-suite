import React, { useState } from 'react';
import { CardProps, Stack, Card, CardContent, Typography } from "@mui/material";
import { useSession } from "next-auth/react";

type AdjudicatorCardType = CardProps &{

};
const AdjudicatorCard: React.FC<AdjudicatorCardType> = (props) => {
    const [ state, setState ] = useState();

    const session = useSession()

    return (
        <Card
            {...props}
        >
            <CardContent>
                <Stack
                    direction={'row'}
                    alignItems={'center'}
                    spacing={2}
                >
                    <Stack
                        sx={{
                            py:{
                                xs:1,
                                md:3
                            },
                            px:{
                                xs:2,
                                md:4
                            },
                            border:"1px solid",
                            borderRadius:2
                        }}
                    >
                        <Typography textAlign={'center'} variant={'h1'}>
                            {session?.data?.adjudicator.letter}
                        </Typography>
                    </Stack>
                    <Stack>
                        <Typography variant={'h3'}>
                            {session.data?.adjudicator?.name}
                        </Typography>
                        <Typography>
                            {session.data?.adjudicator?.competition_name}
                        </Typography>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default AdjudicatorCard;
