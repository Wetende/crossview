import { Link } from '@inertiajs/react';
import { Box, Typography, LinearProgress, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import CurriculumTree from './CurriculumTree';

const CourseSidebar = ({ program, progress, curriculum, activeNodeId, enrollmentId, activeView }) => {
    const isOverview = activeView === 'overview';
    const overviewUrl = program?.id ? `/student/programs/${program.id}/` : '#';

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, bgcolor: 'background.paper' }}>
            {/* Course Title & Progress */}
            <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                <Typography 
                    variant="subtitle1" 
                    fontWeight={700} 
                    color="text.primary"
                    sx={{
                        mb: 1,
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}
                >
                    {program?.name || 'Course'}
                </Typography>
                
                {/* Progress Bar */}
                <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ 
                        height: 4, 
                        borderRadius: 2, 
                        bgcolor: 'grey.200',
                        mb: 0.5,
                        '& .MuiLinearProgress-bar': { 
                            borderRadius: 2,
                            bgcolor: 'primary.main'
                        }
                    }} 
                />
                
                <Typography variant="caption" color="text.secondary">
                    Course progress: {Math.round(progress)}%
                </Typography>
            </Box>

            {/* Scrollable navigation */}
            <Box sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', py: 1 }}>
                {/* Overview pseudo-item - always present, not a CurriculumNode */}
                <ListItemButton
                    component={Link}
                    href={overviewUrl}
                    selected={isOverview}
                    sx={{
                        mx: 1,
                        mb: 0.5,
                        minHeight: 42,
                        borderRadius: 1,
                        px: 1.5,
                        py: 0.75,
                        '&.Mui-selected': {
                            bgcolor: 'primary.lighter',
                            color: 'primary.main',
                        },
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 34 }}>
                        <HomeIcon fontSize="small" color={isOverview ? 'primary' : 'action'} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Overview"
                        primaryTypographyProps={{ variant: 'body2', fontWeight: isOverview ? 600 : 400, noWrap: true }}
                    />
                </ListItemButton>
                <CurriculumTree 
                    nodes={curriculum} 
                    activeNodeId={activeNodeId}
                    enrollmentId={enrollmentId}
                />
            </Box>
        </Box>
    );
};

export default CourseSidebar;
