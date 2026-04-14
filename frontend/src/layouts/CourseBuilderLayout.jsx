import { useMemo } from 'react';
import { Alert, AppBar, Box, Button, Stack, Tab, Tabs, Toolbar, Typography } from '@mui/material';
import { Link, usePage } from '@inertiajs/react';
import {
  IconArrowLeft,
  IconEye,
} from '@tabler/icons-react';
import { getFlashMessages, getFlashSeverity } from '@/utils/userMessages';

const CourseBuilderLayout = ({ children, program, activeTab = 'curriculum', platformFeatures = {}, deploymentMode = 'custom', ...props }) => {
    const { flash = [] } = usePage().props;
    const flashMessages = getFlashMessages(flash);
    // Mode-aware tabs: conditionally show tabs based on platform features and blueprint flags
    const blueprintFlags = program?.blueprint?.featureFlags || {};

    const tabs = useMemo(() => {
        const baseTabs = [
            { label: 'Curriculum', value: 'curriculum', href: `/instructor/programs/${program.id}/manage/` },
            // TODO: Implement later
            // { label: 'Drip', value: 'drip', href: `/instructor/programs/${program.id}/manage/drip/` },
            // { label: 'Settings', value: 'settings', href: `/instructor/programs/${program.id}/manage/settings/` },
        ];

        // Pricing tab: only when payments feature is enabled (Online, NITA, Driving modes)
        if (platformFeatures.payments) {
            baseTabs.push({ label: 'Pricing', value: 'pricing', href: `/instructor/programs/${program.id}/manage/settings/?tab=pricing` });
        }

        // FAQ and Notice tabs: always available
        baseTabs.push({ label: 'FAQ', value: 'faq', href: `/instructor/programs/${program.id}/manage/settings/?tab=faq` });
        baseTabs.push({ label: 'Notice', value: 'notice', href: `/instructor/programs/${program.id}/manage/settings/?tab=notice` });

        // TODO: Implement later
        // Practicum tab: when practicum/portfolio features enabled (TVET, Theology, Driving, NITA)
        // if (blueprintFlags.practicum || blueprintFlags.portfolio) {
        //     baseTabs.push({ label: 'Practicum', value: 'practicum', href: `/instructor/programs/${program.id}/manage/practicum/` });
        // }

        // Note: Gamification is a PLATFORM-LEVEL feature (SuperAdmin toggle, Admin config, Student dashboard)
        // It is NOT configured per-course in Course Builder

        // TODO: Implement later
        // Prerequisites tab: TVET/Theology/Online need course sequencing
        // if (['tvet', 'theology', 'online'].includes(deploymentMode)) {
        //     baseTabs.push({ label: 'Prerequisites', value: 'prerequisites', href: `/instructor/programs/${program.id}/manage/prerequisites/` });
        // }

        // Access tab intentionally hidden from UI for lifetime-access policy.

        return baseTabs;
    }, [program.id, platformFeatures.payments, blueprintFlags.practicum, blueprintFlags.portfolio, deploymentMode]);


    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
            {/* Header - Uses theme-aware dark colors */}
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    bgcolor: '#1e293b',
                    color: '#f1f5f9',
                    zIndex: 1201,
                    borderRadius: 0,
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}
            >
                <Toolbar sx={{ minHeight: 48, justifyContent: 'space-between' }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Button
                            component={Link}
                            href="/instructor/programs/"
                            startIcon={<IconArrowLeft size={20} />}
                            sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff' } }}
                        >
                            Back to programs
                        </Button>
                        <Box sx={{ borderLeft: '1px solid rgba(255,255,255,0.2)', pl: 2, ml: 2 }}>
                            <Typography variant="h6" fontWeight={600}>
                                {program.name}
                            </Typography>
                        </Box>
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
                                    color: 'rgba(255,255,255,0.6)',
                                    '&.Mui-selected': { color: '#fff' }
                                },
                                '& .MuiTabs-indicator': { backgroundColor: '#fff', height: 3 }
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
                                        color: '#f1f5f9',
                                        borderColor: 'rgba(255,255,255,0.3)',
                                        textTransform: 'none',
                                        borderRadius: '0 !important',
                                        borderWidth: '1px !important',
                                        py: 0.75,
                                        px: 2,
                                        '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' }
                                    }}
                                >
                                    View
                                </Button>
                            </>
                        )}
                    </Stack>
                </Toolbar>
            </AppBar>

            {flashMessages.length > 0 && (
                <Box sx={{ position: 'fixed', top: 56, right: 16, zIndex: 1300 }}>
                    <Stack spacing={1}>
                        {flashMessages.map((msg, idx) => (
                            <Alert key={idx} severity={getFlashSeverity(msg.type)}>
                                {msg.message}
                            </Alert>
                        ))}
                    </Stack>
                </Box>
            )}

            {/* Main Content Area */}
            <Box sx={{ display: 'flex', flexGrow: 1, mt: '48px', overflow: 'hidden' }}>
                {children}
            </Box>
        </Box>
    );
};

export default CourseBuilderLayout;
