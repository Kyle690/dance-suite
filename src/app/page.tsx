'use client';
import { Typography, Box, Button } from '@mui/material';
import { useRouter } from "next/navigation";

const Home = () => {
    const navigate = useRouter();

    return (
        <Box
            sx={{
                position: 'relative',
                minHeight: '100vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                // Dark charcoal base
                background: '#0e0c0b',
            }}
        >
            {/* Wall backdrop — subtle warm ambient glow */}
            <Box
                aria-hidden
                sx={{
                    position: 'absolute',
                    inset: 0,
                    background: `
                        radial-gradient(ellipse 90% 55% at 50% 28%, #22201e 0%, transparent 70%),
                        radial-gradient(ellipse 60% 40% at 50% 5%,  #1a1714 0%, transparent 60%)
                    `,
                    pointerEvents: 'none',
                }}
            />

            {/* Ground plane — the "surface" the product sits on */}
            <Box
                aria-hidden
                sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '42%',
                    // Perspective surface: lighter in the centre, darker at edges/bottom
                    background: `
                        radial-gradient(ellipse 70% 80% at 50% 0%, #2b2724 0%, transparent 70%),
                        linear-gradient(180deg,
                            transparent 0%,
                            #191714 18%,
                            #232018 55%,
                            #1a1714 80%,
                            #0e0c0b 100%
                        )
                    `,
                    pointerEvents: 'none',
                }}
            />

            {/* Horizon line — the edge where wall meets surface */}
            <Box
                aria-hidden
                sx={{
                    position: 'absolute',
                    bottom: '42%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '72%',
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent 0%, #3a3530 20%, #4a4540 50%, #3a3530 80%, transparent 100%)',
                    pointerEvents: 'none',
                }}
            />

            {/* Edge vignette */}
            <Box
                aria-hidden
                sx={{
                    position: 'absolute',
                    inset: 0,
                    background: `
                        radial-gradient(ellipse 100% 100% at 50% 50%,
                            transparent 40%,
                            rgba(0,0,0,0.55) 100%
                        )
                    `,
                    pointerEvents: 'none',
                }}
            />

            {/* Content */}
            <Box
                sx={{
                    position: 'relative',
                    zIndex: 1,
                    textAlign: 'center',
                    px: 4,
                }}
            >
                <Typography
                    variant="overline"
                    sx={{
                        color: '#6b6360',
                        letterSpacing: '0.18em',
                        fontSize: '0.7rem',
                        mb: 2,
                        display: 'block',
                    }}
                >
                    Dance Suite
                </Typography>

                <Typography
                    variant="h3"
                    component="h1"
                    sx={{
                        color: '#e8e2d9',
                        fontWeight: 700,
                        letterSpacing: '-0.03em',
                        mb: 2,
                    }}
                >
                    Scrutineer
                </Typography>

                <Typography
                    variant="body1"
                    sx={{
                        color: '#6b6360',
                        mb: 4,
                        maxWidth: 340,
                        mx: 'auto',
                        lineHeight: 1.7,
                    }}
                >
                    Competition management &amp; adjudication platform
                </Typography>

                <Button
                    onClick={() => navigate.push('/scrutineer/competitions')}
                    size="small"
                    variant="contained"
                    sx={{
                        bgcolor: '#e8e2d9',
                        color: '#1f1c1a',
                        fontWeight: 600,
                        px: 3,
                        py: 1,
                        borderRadius: '8px',
                        '&:hover': {
                            bgcolor: '#f5f2ed',
                        },
                    }}
                >
                    Sign in
                </Button>
            </Box>
        </Box>
    );
};

export default Home;
