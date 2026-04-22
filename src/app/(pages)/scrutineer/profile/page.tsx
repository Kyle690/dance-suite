'use client'
import React from 'react';
import Navbar from "@/app/components/layout/Navbar";
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
    Container,
    List,
    Stack, Table,
    TableContainer, TableBody, TableRow, TableCell, Typography, Button, Chip
} from '@mui/material'
import { useQuery } from "@tanstack/react-query";
import { getScrutineerInfo } from "@/app/server/scrutineer";
import { startCase, toLower } from "lodash";
import MenuButtons from "@/app/components/layout/MenuButtons";
import { Delete, Edit, Info } from "@mui/icons-material";
import EditProfileDialog, { EditProfilePayload } from "@/app/components/dialogs/scrutineer/EditProfileDialog";
import { useDialogs } from "@toolpad/core";

type pageType = {};
const Page: React.FC<pageType> = () => {
    const dialogs = useDialogs();

    const {
        data,
        isLoading,
    }=useQuery({
        queryKey:[ 'scrutineer_profile' ],
        queryFn:async()=>{
            const response = await getScrutineerInfo();
            if(response.data)return response.data;
            return null;
        }
    })

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Navbar />
            <Container
                maxWidth={'lg'}
                sx={{
                    p:{
                        xs:2,
                        md:4,
                    },
                    display:'flex',
                    flex:1,
                    flexDirection:'column',
                    minHeight:'100vh'
                }}
            >
                {isLoading && (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height:'100%',
                        }}
                    >
                        <CircularProgress/>
                    </Box>
                )}
                {!isLoading && (
                    <Stack spacing={3}>
                        <Stack>
                            <Card>
                                <CardHeader
                                    title={'Profile Details'}
                                    action={(
                                        <MenuButtons
                                            name={'details'}
                                            id={'profile'}
                                            buttons={[
                                                {
                                                    label:'Edit',
                                                    icon:<Edit color={'primary'}/>,
                                                    onClick:async()=>await dialogs.open(EditProfileDialog, data?.details as EditProfilePayload)
                                                },
                                                {
                                                    label:'Delete Account',
                                                    icon:<Delete color={'error'}/>,
                                                    onClick:()=>{}
                                                }
                                            ]}
                                        />
                                    )}
                                />
                                <CardContent>
                                    <TableContainer>
                                        <Table size={'small'}>
                                            <TableBody>
                                                {[ 'first_name','last_name','email','phone' ].map((item)=>(
                                                    <TableRow
                                                        key={item}
                                                    >
                                                        <TableCell width={100}><Typography color={'textDisabled'}>{startCase(item)}</Typography></TableCell>
                                                        <TableCell>{data?.details?.[item as keyof typeof data.details]}</TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow>
                                                    <TableCell>
                                                        <Typography color={'textDisabled'}>
                                                            Roles
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Stack
                                                            flexDirection={'row'}
                                                            flexWrap={'wrap'}
                                                        >
                                                            {data?.details.roles.map((role)=>(
                                                                <Chip
                                                                    label={startCase(toLower(role))}
                                                                    size="small"
                                                                    key={role}
                                                                />
                                                            ))}
                                                        </Stack>
                                                    </TableCell>

                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Stack>
                        <Card>
                            <CardHeader
                                title={'Licenses'}
                            />
                            <CardContent>
                                {!data?.licenses.length ? (
                                    <Stack
                                        spacing={2}
                                        alignItems={'center'}
                                        justifyContent={'center'}
                                    >
                                        <Stack
                                            alignItems={'center'}
                                            justifyContent={'center'}
                                            mb={3}
                                            spacing={1}
                                        >
                                            <Info/>
                                            <Typography variant={'h6'}>
                                                No Active Licences found
                                            </Typography>
                                            <Typography variant={'caption'}>
                                                You will have limited access to features without a license. Please purchase a license to access all features.
                                            </Typography>
                                        </Stack>
                                        <Button
                                            size={'small'}
                                            variant={'contained'}
                                            color={'primary'}
                                            sx={{
                                                maxWidth:250,
                                            }}
                                        >
                                            Buy Now
                                        </Button>
                                    </Stack>
                                ):(
                                    <Typography>

                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Stack>
                )}
            </Container>
        </Box>
    );
};

export default Page;
