/**
 * MUI Component Overrides
 * Customizes default MUI component styles for Crossview branding
 */

export default function componentsOverride(theme) {
    return {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 4,
                    padding: "6px 12px",
                    fontWeight: 600,
                    textTransform: "none",
                },
                contained: {
                    boxShadow: "none",
                    "&:hover": {
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
                    },
                },
                outlined: {
                    borderWidth: 1,
                    "&:hover": {
                        borderWidth: 1,
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
                elevation1: {
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 8,
                    },
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.primary.main,
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                    fontWeight: 500,
                },
            },
        },
        MuiAvatar: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 4,
                    marginBottom: 4,
                    padding: "8px 12px", // Added explicit padding for consistency
                    "&.Mui-selected": {
                        backgroundColor: theme.palette.primary.lighter,
                        "&:hover": {
                            backgroundColor: theme.palette.primary.lighter,
                        },
                    },
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderRight: "none",
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: "none",
                    borderBottom: `1px solid ${theme.palette.divider}`,
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    borderRadius: 6,
                    fontSize: 12,
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 16,
                },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
    };
}
