import { Alert, AppBar, Box, Button, Stack, Tab, Tabs, Toolbar, Typography } from '@mui/material';
import { Link, usePage } from '@inertiajs/react';
import {
  IconArrowLeft,
} from '@tabler/icons-react';
import { getFlashMessages, getFlashSeverity } from '@/utils/userMessages';
import {
    getAvailableBuilderTabs,
    normalizeBuilderTab,
} from '@/features/course-builder/utils/builderTabs';

const CourseBuilderLayout = ({ children, program, activeTab = 'curriculum', ...props }) => {
    const { flash = [] } = usePage().props;
    const flashMessages = getFlashMessages(flash);
    const tabs = getAvailableBuilderTabs(program);
    const selectedTab = normalizeBuilderTab(program, activeTab);


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
                    <Box sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', maxWidth: '70%', overflow: 'hidden' }}>
                        <Tabs
                            value={selectedTab}
                            onChange={(e, newVal) => {
                                if (props.onTabChange) {
                                    props.onTabChange(newVal);
                                }
                            }}
                            variant="scrollable"
                            scrollButtons="auto"
                            allowScrollButtonsMobile
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
                        {props.appBarActions}
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
