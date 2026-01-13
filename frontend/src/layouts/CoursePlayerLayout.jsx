import React from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Avatar, Button } from '@mui/material';
import { Link, usePage } from '@inertiajs/react';
import HomeIcon from '@mui/icons-material/Home';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

const CoursePlayerLayout = ({ children, programTitle, backLink }) => {
    const { auth } = usePage().props;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            {/* Minimal Header */}
            <AppBar position="fixed" elevation={1} sx={{ bgcolor: 'white', color: 'text.primary', zIndex: 1201 }}>
                <Toolbar sx={{ minHeight: 64 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                        <Button 
                            component={Link} 
                            href={backLink || '/student/programs/'}
                            startIcon={<NavigateBeforeIcon />}
                            color="inherit"
                            sx={{ mr: 2 }}
                        >
                            Back
                        </Button>
                        <Typography variant="h6" fontWeight={700} noWrap>
                            {programTitle}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                         <Avatar 
                            sx={{ width: 32, height: 32, bgcolor: 'primary.main', cursor: 'pointer' }}
                            component={Link}
                            href="/student/profile/"
                        >
                            {auth?.user?.firstName?.[0] || 'U'}
                        </Avatar>
                    </Box>
                </Toolbar>
            </AppBar>
            
            {/* Main Content Area - push down by header height */}
            <Box sx={{ display: 'flex', flexGrow: 1, mt: '64px', overflow: 'hidden' }}>
                {children}
            </Box>
        </Box>
    );
};

export default CoursePlayerLayout;
