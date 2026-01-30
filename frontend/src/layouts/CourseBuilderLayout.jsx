import React, { useMemo } from 'react';
import { Box, AppBar, Toolbar, Typography, Button, Tabs, Tab, Stack } from '@mui/material';
import { Link, usePage } from '@inertiajs/react';
import {
  IconArrowLeft,
  IconEye,
} from '@tabler/icons-react';

const CourseBuilderLayout = ({ children, program, activeTab = 'curriculum', platformFeatures = {}, deploymentMode = 'custom', ...props }) => {
    // Mode-aware tabs: conditionally show tabs based on platform features and blueprint flags
    const blueprintFlags = program?.blueprint?.featureFlags || {};
    
    const tabs = useMemo(() => {
        const baseTabs = [
            { label: 'Curriculum', value: 'curriculum', href: `/instructor/programs/${program.id}/manage/` },
            { label: 'Drip', value: 'drip', href: `/instructor/programs/${program.id}/manage/drip/` },
            { label: 'Settings', value: 'settings', href: `/instructor/programs/${program.id}/manage/settings/` },
        ];
        
        // Pricing tab: only when payments feature is enabled (Online, NITA, Driving modes)
        if (platformFeatures.payments) {
            baseTabs.push({ label: 'Pricing', value: 'pricing', href: `/instructor/programs/${program.id}/manage/pricing/` });
        }
        
        // FAQ and Notice tabs: always available
        baseTabs.push({ label: 'FAQ', value: 'faq', href: `/instructor/programs/${program.id}/manage/faq/` });
        baseTabs.push({ label: 'Notice', value: 'notice', href: `/instructor/programs/${program.id}/manage/notice/` });
        
        // Practicum tab: when practicum/portfolio features enabled (TVET, Theology, Driving, NITA)
        if (blueprintFlags.practicum || blueprintFlags.portfolio) {
            baseTabs.push({ label: 'Practicum', value: 'practicum', href: `/instructor/programs/${program.id}/manage/practicum/` });
        }
        
        // Note: Gamification is a PLATFORM-LEVEL feature (SuperAdmin toggle, Admin config, Student dashboard)
        // It is NOT configured per-course in Course Builder
        
        // Prerequisites tab: TVET/Theology/Online need course sequencing
        if (['tvet', 'theology', 'online'].includes(deploymentMode)) {
            baseTabs.push({ label: 'Prerequisites', value: 'prerequisites', href: `/instructor/programs/${program.id}/manage/prerequisites/` });
        }
        
        // Time Limit tab: subscription-based modes (Online, NITA, Driving)
        if (['online', 'nita', 'driving'].includes(deploymentMode)) {
            baseTabs.push({ label: 'Access', value: 'access', href: `/instructor/programs/${program.id}/manage/access/` });
        }
        
        return baseTabs;
    }, [program.id, platformFeatures.payments, blueprintFlags.practicum, blueprintFlags.portfolio, deploymentMode]);


    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
            {/* Header - Uses theme-aware dark colors */}
            <AppBar 
                position="fixed" 
                elevation={0} 
                sx={{ 
                    bgcolor: 'background.paper', 
                    color: 'text.primary', 
                    zIndex: 1201, 
                    borderRadius: 0,
                    borderBottom: 1,
                    borderColor: 'divider'
                }}
            >
                <Toolbar sx={{ minHeight: 48, justifyContent: 'space-between' }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Button 
                            component={Link} 
                            href="/instructor/programs/"
                            startIcon={<IconArrowLeft size={20} />}
                            sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
                        >
                            Back to programs
                        </Button>
                        <Typography variant="h6" fontWeight={600} sx={{ borderLeft: '1px solid', borderColor: 'divider', pl: 2, ml: 2 }}>
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
                                    color: 'text.secondary',
                                    '&.Mui-selected': { color: 'primary.main' }
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
                                        color: 'text.primary',
                                        borderColor: 'divider',
                                        textTransform: 'none',
                                        borderRadius: '0 !important',
                                        borderWidth: '1px !important',
                                        py: 0.75,
                                        px: 2,
                                        '&:hover': { borderColor: 'text.primary', bgcolor: 'action.hover' }
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
