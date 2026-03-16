'use client';
import { Typography, Box, Button, Stack } from '@mui/material';
import { useRouter } from "next/navigation";


const Home=()=> {

    const navigate = useRouter();

    return (
        <Box
            p={10}
        >
            <Typography
                variant="h3" component="h1"
                gutterBottom
            >
                Welcome to Dance Suite Scrutineer
            </Typography>

            <Typography
                variant="h6" color="text.secondary"
                paragraph
            >
                Your comprehensive dance competition management system
            </Typography>

            <Button
                onClick={()=>navigate.push('/scrutineer/profile')}
                size={'small'}
                variant="contained"
            >
                Scrutineer Sign in
            </Button>
        </Box>
    );
}

export default Home;
