import React from 'react';
import { sections } from "@prisma/client";
import { Box, TableContainer, Table, TableBody, TableRow, TableCell, Button, Typography } from "@mui/material";
import { grey }from '@mui/material/colors';

type SectionDetailsProps = {
    data:sections|null
}

const SectionDetails: React.FC<SectionDetailsProps> = ({
    data
}) => {

    if(!data){
        return (
            <Box
                sx={{
                    px:3,
                    py:2,
                    border:`1px solid ${grey[300]}`,
                    borderRadius:4,
                    height:300
                }}
            >
                <Typography color={'error'}>
                    Error loading section
                </Typography>
            </Box>
        )
    }

    return (
        <Box
            sx={{
                px:3,
                py:2,
                border:`1px solid ${grey[300]}`,
                borderRadius:4,
            }}
        >
            <TableContainer>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell>
                                Entry Type
                            </TableCell>
                            <TableCell>
                                {data.entry_type}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Competition Type</TableCell>
                            <TableCell>{data.competitive_type}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default SectionDetails;
