import React, { useState } from 'react';
import { Box, IconButton, useTheme, Typography, Button, AppBar, Toolbar, Drawer } from '@mui/material';
import { Link } from '@inertiajs/react';
import { 
    Menu as MenuIcon, 
    ArrowBack,
    Close as CloseIcon,
    DarkMode,
    LightMode,
    ChatBubbleOutline
} from '@mui/icons-material';

const ClassroomLayout = ({ 
    children, 
    programTitle, 
    backLink, 
    RightPanel, 
    LeftPanel,
    isSidebarOpen,
    onToggleSidebar,
    isDiscussionsOpen,
    onToggleDiscussions
}) => {
    const theme = useTheme();
    const [isDarkMode, setIsDarkMode] = useState(false);
    
    const discussionsWidth = 320;

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100vh', 
            bgcolor: 'background.default',
            overflow: 'hidden'
        }}>
            {/* Header Bar */}
            <AppBar 
                position="static" 
                color="default" 
                elevation={0} 
                sx={{ 
                    bgcolor: 'background.paper', 
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    zIndex: theme.zIndex.drawer + 1 
                }}
            >
                <Toolbar variant="dense" sx={{ minHeight: 48, justifyContent: 'space-between' }}>
                    {/* Left Section */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton 
                            size="small" 
                            component={Link} 
                            href={backLink}
                            sx={{ color: 'text.secondary' }}
                        >
                            <ArrowBack fontSize="small" />
                        </IconButton>
                        
                        <Box 
                            sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 0.5,
                                bgcolor: 'primary.main',
                                color: 'white',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1,
                                cursor: 'pointer'
                            }}
                            onClick={onToggleSidebar}
                        >
                            <MenuIcon fontSize="small" />
                            <Typography variant="body2" fontWeight={500}>
                                Curriculum
                            </Typography>
                            {isSidebarOpen && <CloseIcon fontSize="small" sx={{ ml: 0.5 }} />}
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', ml: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                                Course
                            </Typography>
                            <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 300 }}>
                                {programTitle}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Right Section */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton 
                            size="small" 
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            sx={{ color: 'text.secondary' }}
                        >
                            {isDarkMode ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
                        </IconButton>
                        
                        <Button
                            size="small"
                            startIcon={<ChatBubbleOutline fontSize="small" />}
                            onClick={onToggleDiscussions}
                            sx={{ 
                                textTransform: 'none',
                                color: isDiscussionsOpen ? 'primary.main' : 'text.secondary'
                            }}
                        >
                            Discussions
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Main Content Area */}
            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
                
                {/* Left Sidebar (Curriculum) */}
                <Box 
                    component="nav"
                    sx={{ 
                        width: isSidebarOpen ? 280 : 0, 
                        flexShrink: 0,
                        borderRight: isSidebarOpen ? '1px solid' : 'none', 
                        borderColor: 'divider',
                        transition: theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                        overflow: 'hidden',
                        bgcolor: 'background.paper'
                    }}
                >
                    <Box sx={{ width: 280, height: '100%', overflowY: 'auto' }}>
                        {LeftPanel}
                    </Box>
                </Box>

                {/* Center Stage (Content) - Expands to fill available space */}
                <Box 
                    component="main"
                    sx={{ 
                        flexGrow: 1, 
                        height: '100%', 
                        display: 'flex',
                        flexDirection: 'column',
                        bgcolor: 'background.default',
                        position: 'relative',
                        // Adjust margin when discussions is open
                        marginRight: isDiscussionsOpen ? `${discussionsWidth}px` : 0,
                        transition: theme.transitions.create('margin', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                    }}
                >
                    <Box sx={{ 
                        flexGrow: 1, 
                        overflowY: 'auto',
                        px: { xs: 2, md: 6 },
                        py: 3,
                        maxWidth: 900,
                        mx: 'auto',
                        width: '100%',
                        // Hide scrollbar
                        '&::-webkit-scrollbar': { display: 'none' },
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}>
                        {children}
                    </Box>
                </Box>

                {/* Right Sidebar (Discussions) - Fixed position overlay */}
                <Box
                    sx={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: discussionsWidth,
                        bgcolor: 'background.paper',
                        borderLeft: '1px solid',
                        borderColor: 'divider',
                        transform: isDiscussionsOpen ? 'translateX(0)' : `translateX(${discussionsWidth}px)`,
                        transition: theme.transitions.create('transform', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                        zIndex: 10,
                        overflowY: 'auto'
                    }}
                >
                    {RightPanel}
                </Box>
            </Box>
        </Box>
    );
};

export default ClassroomLayout;
