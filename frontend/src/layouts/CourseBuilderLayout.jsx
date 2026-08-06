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
                <Toolbar
                    sx={{
                        minHeight: { xs: 112, lg: 64 },
                        px: { xs: 1, sm: 2 },
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: 'minmax(0, 1fr) minmax(0, 65vw)',
                            lg: 'minmax(0, 1fr) minmax(0, 1.5fr) auto',
                        },
                        gridTemplateRows: { xs: '64px 48px', lg: '64px' },
                        gridTemplateAreas: {
                            xs: '"identity actions" "tabs tabs"',
                            lg: '"identity tabs actions"',
                        },
                        columnGap: { xs: 1, sm: 2 },
                    }}
                >
                    <Box
                        sx={{
                            gridArea: 'identity',
                            display: 'flex',
                            alignItems: 'center',
                            minWidth: 0,
                            overflow: 'hidden',
                        }}
                    >
                        <Button
                            component={Link}
                            href="/instructor/programs/"
                            startIcon={<IconArrowLeft size={20} />}
                            aria-label="Back to programs"
                            sx={{
                                color: 'rgba(255,255,255,0.7)',
                                flexShrink: 0,
                                minWidth: { xs: 40, md: 'auto' },
                                px: { xs: 1, md: 2 },
                                '& .MuiButton-startIcon': {
                                    m: { xs: 0, md: '0 8px 0 -4px' },
                                },
                                '&:hover': { color: '#fff' },
                            }}
                        >
                            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                                Back to programs
                            </Box>
                        </Button>
                        <Box
                            sx={{
                                borderLeft: '1px solid rgba(255,255,255,0.2)',
                                pl: { xs: 1, sm: 2 },
                                ml: { xs: 1, sm: 2 },
                                minWidth: 0,
                                overflow: 'hidden',
                            }}
                        >
                            <Typography
                                variant="h6"
                                fontWeight={600}
                                noWrap
                                title={program.name}
                                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                            >
                                {program.name}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Center Tabs - Support both URL and Client-side switching */}
                    <Box
                        sx={{
                            gridArea: 'tabs',
                            width: '100%',
                            minWidth: 0,
                            overflow: 'hidden',
                        }}
                    >
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
                                minHeight: 48,
                                '& .MuiTab-root': {
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    fontSize: '0.95rem',
                                    minHeight: 48,
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

                    <Box
                        sx={{
                            gridArea: 'actions',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            minWidth: 0,
                            maxWidth: '100%',
                            overflowX: 'auto',
                            scrollbarWidth: 'none',
                            '&::-webkit-scrollbar': { display: 'none' },
                        }}
                    >
                        {props.appBarActions}
                    </Box>
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
            <Box
                sx={{
                    display: 'flex',
                    flexGrow: 1,
                    mt: { xs: '112px', lg: '64px' },
                    overflow: 'hidden',
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

export default CourseBuilderLayout;
