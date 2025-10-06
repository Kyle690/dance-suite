'use client';
import { Typography, Box, Button } from '@mui/material';
import { useRouter } from "next/navigation";


const Home=()=> {

    const navigate = useRouter()

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
                variant={'contained'}
                onClick={()=>navigate.push('/competitions')}
            >
                Sign in
            </Button>
        </Box>
    );
}

export default Home;
