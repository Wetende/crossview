import React from 'react';
import { Box, AppBar, Toolbar, Typography, Button, Tabs, Tab, Stack } from '@mui/material';
import { Link, usePage } from '@inertiajs/react';
import {
  IconArrowLeft,
  IconEye,
} from '@tabler/icons-react';

const CourseBuilderLayout = ({ children, program, activeTab = 'curriculum', ...props }) => {
    // Define tabs list
    const tabs = [
        { label: 'Curriculum', value: 'curriculum', href: `/instructor/programs/${program.id}/manage/` },
        { label: 'Drip', value: 'drip', href: `/instructor/programs/${program.id}/manage/drip/` },
        { label: 'Settings', value: 'settings', href: `/instructor/programs/${program.id}/manage/settings/` },
        { label: 'Pricing', value: 'pricing', href: `/instructor/programs/${program.id}/manage/pricing/` },
        { label: 'FAQ', value: 'faq', href: `/instructor/programs/${program.id}/manage/faq/` },
        { label: 'Notice', value: 'notice', href: `/instructor/programs/${program.id}/manage/notice/` },
    ];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
            {/* Header - Uses theme-aware dark colors */}
            <AppBar 
                position="fixed" 
                elevation={0} 
                sx={{ 
                    bgcolor: 'grey.900', 
                    color: 'grey.50', 
                    zIndex: 1201, 
                    borderRadius: 0 
                }}
            >
                <Toolbar sx={{ minHeight: 48, justifyContent: 'space-between' }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Button 
                            component={Link} 
                            href="/instructor/programs/"
                            startIcon={<IconArrowLeft size={20} />}
                            sx={{ color: 'grey.400', '&:hover': { color: 'grey.50' } }}
                        >
                            Back to programs
                        </Button>
                        <Typography variant="h6" fontWeight={600} sx={{ borderLeft: '1px solid', borderColor: 'grey.700', pl: 2, ml: 2 }}>
                            {program.name}
                        </Typography>
                    </Stack>

                    {/* Center Tabs - Support both URL and Client-side switching */}
                    <Box sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                        <Tabs 
                            value={activeTab} 
                            onChange={(e, newVal) => {
                                // If onTabChange is provided (client-side), call it
                                if (props.onTabChange) {
                                    props.onTabChange(newVal);
                                }
                            }}
                            textColor="inherit"
                            indicatorColor="primary"
                            sx={{ 
                                '& .MuiTab-root': { 
                                    textTransform: 'none', 
                                    fontWeight: 500,
                                    fontSize: '0.95rem',
                                    minWidth: 'auto',
                                    px: 2,
                                    color: 'grey.500',
                                    '&.Mui-selected': { color: 'grey.50' }
                                },
                                '& .MuiTabs-indicator': { backgroundColor: 'primary.main', height: 3 }
                            }}
                        >
                            {tabs.map((tab) => (
                                props.onTabChange ? (
                                    // Client-side mode
                                    <Tab 
                                        key={tab.value} 
                                        label={tab.label} 
                                        value={tab.value} 
                                    />
                                ) : (
                                    // URL Navigation mode
                                    <Tab 
                                        key={tab.value} 
                                        label={tab.label} 
                                        value={tab.value} 
                                        component={Link}
                                        href={tab.href}
                                        preserveState
                                    />
                                )
                            ))}
                        </Tabs>
                    </Box>

                    <Stack direction="row" spacing={2} alignItems="center">
                        {props.appBarActions ? props.appBarActions : (
                            <>
                                <Button
                                    variant="contained"
                                    size="small"
                                    color="primary"
                                    sx={{ 
                                        textTransform: 'none', 
                                        fontWeight: 600, 
                                        borderRadius: '0 !important',
                                        py: 0.75,
                                        px: 2
                                    }}
                                >
                                    Published
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<IconEye size={18} />}
                                    sx={{
                                        color: 'grey.50',
                                        borderColor: 'grey.700',
                                        textTransform: 'none',
                                        borderRadius: '0 !important',
                                        borderWidth: '1px !important',
                                        py: 0.75,
                                        px: 2,
                                        '&:hover': { borderColor: 'grey.50', bgcolor: 'action.hover' }
                                    }}
                                >
                                    View
                                </Button>
                            </>
                        )}
                    </Stack>
                </Toolbar>
            </AppBar>
            
            {/* Main Content Area */}
            <Box sx={{ display: 'flex', flexGrow: 1, mt: '48px', overflow: 'hidden' }}>
                {children}
            </Box>
        </Box>
    );
};

export default CourseBuilderLayout;
