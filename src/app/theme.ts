import { createTheme, alpha } from "@mui/material/styles";

/**
 * Application theme — luxury dance-suite aesthetic.
 *
 * Rules:
 *  - Zero hardcoded hex values in component overrides — all colours come
 *    from theme.palette so dark / light switching works automatically.
 *  - Inter throughout — clean, legible, premium.
 *  - Warm charcoal primary, terracotta accent, warm white paper.
 *  - 6 px border radius — refined without being harsh.
 */
const theme = createTheme({
    cssVariables: {
        colorSchemeSelector: 'data-toolpad-color-scheme',
    },

    colorSchemes: {
        light: {
            palette: {
                primary: {
                    main: '#1F1C1A',
                    light: '#3A3532',
                    dark: '#0F0D0C',
                    contrastText: '#FFFFFF',
                },
                secondary: {
                    main: '#B5603A',
                    light: '#D4825A',
                    dark: '#8A4220',
                    contrastText: '#FFFFFF',
                },
                background: {
                    paper: "#fff",
                    default: "#F5F5F5",
                },
                text: {
                    primary: '#1F1C1A',
                    secondary: '#6B6360',
                    disabled: '#B0ABA8',
                },
                divider: '#EAE5E0',
                error: { main: '#B04040' },
                success: { main: '#2A5C45' },
                warning: { main: '#A06020' },
                info: { main: '#2A4A6B' },
            },
        },
        dark: {
            palette: {
                primary: {
                    main: '#E8E2D9',
                    light: '#F5F2ED',
                    dark: '#C8BFB2',
                    contrastText: '#1F1C1A',
                },
                secondary: {
                    main: '#B5603A',
                    light: '#D4825A',
                    dark: '#8A4220',
                    contrastText: '#FFFFFF',
                },
                background: {
                    default: '#121212',
                    paper: '#252525'
                },
                text: {
                    primary: '#F5F3F0',
                    secondary: '#A09890',
                },
                divider: '#2E2A26',
                error: {
                    main: '#F87171',
                    dark: '#EF4444',
                    contrastText: '#100E0C',
                },
                warning: {
                    main: '#E8A050',
                    dark: '#C07830',
                    contrastText: '#100E0C',
                },
                success: {
                    main: '#34D399',
                    dark: '#10B981',
                    contrastText: '#100E0C',
                },
                info: {
                    main: '#7EB8D4',
                    dark: '#5090B0',
                    contrastText: '#100E0C',
                },
            },
        },
    },

    typography: {
        fontFamily: '"Inter", "system-ui", "-apple-system", sans-serif',
        fontSize: 14,
        fontWeightMedium: 500,
        fontWeightBold: 600,
        h1: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 },
        h2: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25 },
        h3: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3 },
        h4: { fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.35 },
        h5: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
        h6: { fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.4 },
        body1: { fontSize: '0.875rem', lineHeight: 1.6 },
        body2: { fontSize: '0.8125rem', lineHeight: 1.55 },
        caption: { fontSize: '0.75rem', lineHeight: 1.5 },
        overline: { fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' },
        button: { fontSize: '0.875rem', fontWeight: 500, textTransform: 'none', letterSpacing: '0' },
    },

    shape: {
        borderRadius: 6,
    },

    components: {
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    boxShadow: 'none',
                    '&:hover': { boxShadow: 'none' },
                    '&:active': { boxShadow: 'none' },
                },
                sizeSmall: { fontSize: '0.8125rem', padding: '3px 10px' },
                sizeMedium: { padding: '6px 16px' },
            },
        },

        MuiButtonGroup: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: { boxShadow: 'none' },
            },
        },

        MuiPaper: {
            styleOverrides: {
                root: { backgroundImage: 'none' },
                rounded: { borderRadius: 10 },
            },
        },

        MuiCard: {
            styleOverrides: {
                root: ({ theme }) => ({
                    borderRadius: 12,
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: 'none',
                }),
            },
        },

        MuiDialog: {
            styleOverrides: {
                paper: { borderRadius: 12 },
            },
        },

        MuiDialogTitle: {
            styleOverrides: {
                root: { fontSize: '1rem', fontWeight: 600, paddingBottom: 8 },
            },
        },

        MuiChip: {
            styleOverrides: {
                root: ({ theme })=>({
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    '&.MuiChip-filled.MuiChip-sizeSmall':{
                        height:'20px'
                    },
                    '&.MuiChip-colorSuccess':{
                        backgroundColor: alpha(theme.palette.success.main, 0.12),
                        color: theme.palette.success.main,
                    },
                    '&.MuiChip-colorError':{
                        backgroundColor: alpha(theme.palette.error.main, 0.12),
                        color: theme.palette.error.main,
                    },
                    '&.MuiChip-colorPrimary':{
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                        color: theme.palette.primary.main,
                    },
                    '&.MuiChip-colorSecondary':{
                        backgroundColor: alpha(theme.palette.secondary.main, 0.15),
                        color: theme.palette.secondary.main,
                    },
                    '&.MuiChip-colorInfo':{
                        backgroundColor: alpha(theme.palette.info.main, 0.12),
                        color: theme.palette.info.main,
                    },
                    '&.MuiChip-colorWarning':{
                        backgroundColor: alpha(theme.palette.warning.main, 0.12),
                        color: theme.palette.warning.main,
                    }
                }),
            },
        },
        MuiTableContainer: {
            styleOverrides: {
                root: { borderRadius: 10 },
            },
        },

        MuiTableCell: {
            styleOverrides: {
                root: { fontSize: '0.8125rem', padding: '8px 12px' },
                head: ({ theme }) => ({
                    fontWeight: 600,
                    fontSize: '0.6875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: theme.palette.text.secondary,
                }),
                sizeSmall: { padding: '5px 10px' },
            },
        },

        MuiInputBase: {
            styleOverrides: {
                root: { fontSize: '0.875rem' },
            },
        },

        MuiOutlinedInput: {
            styleOverrides: {
                root: { borderRadius: 6 },
            },
        },

        MuiSelect: {
            styleOverrides: {
                select: { fontSize: '0.875rem' },
            },
        },

        MuiMenuItem: {
            styleOverrides: {
                root: { fontSize: '0.875rem', minHeight: 36 },
            },
        },

        MuiListItemText: {
            styleOverrides: {
                primary: { fontSize: '0.875rem' },
                secondary: { fontSize: '0.8125rem' },
            },
        },

        MuiTooltip: {
            styleOverrides: {
                tooltip: ({ theme }) => ({
                    fontSize: '0.75rem',
                    borderRadius: 6,
                    backgroundColor: theme.palette.grey[900],
                    color: theme.palette.common.white,
                    padding: '5px 10px',
                }),
            },
        },

        MuiLinearProgress: {
            styleOverrides: {
                root: { borderRadius: 4 },
            },
        },
        MuiDataGrid: {
            styleOverrides: {
                root: ({ theme }) => ({
                    borderColor: theme.palette.divider,
                    '--DataGrid-rowBorderColor': theme.palette.divider,
                    '& .MuiDataGrid-cell': {
                        borderColor: theme.palette.divider,
                    },
                    '& .MuiDataGrid-columnHeaders': {
                        borderBottomColor: theme.palette.divider,
                    },
                    '& .MuiDataGrid-footerContainer': {
                        borderTopColor: theme.palette.divider,
                    },
                }),
            },
        },
    },
});

export default theme;
