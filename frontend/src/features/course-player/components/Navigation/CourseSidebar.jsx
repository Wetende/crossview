import { Link } from '@inertiajs/react';
import { Box, Typography, LinearProgress, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import CurriculumTree from './CurriculumTree';

const CourseSidebar = ({ program, progress, curriculum, activeNodeId, enrollmentId, activeView }) => {
    const isOverview = activeView === 'overview';
    const overviewUrl = program?.id ? `/student/programs/${program.id}/` : '#';

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
            {/* Course Title & Progress - Reduced padding */}
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography 
                    variant="subtitle1" 
                    fontWeight={700} 
                    color="text.primary"
                    sx={{ mb: 1, lineHeight: 1.3 }}
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

            {/* Overview pseudo-item - always present, not a CurriculumNode */}
            <ListItemButton
                component={Link}
                href={overviewUrl}
                selected={isOverview}
                sx={{
                    mx: 2,
                    mt: 1.5,
                    mb: 1,
                    borderRadius: 1,
                    '&.Mui-selected': {
                        bgcolor: 'primary.lighter',
                        color: 'primary.main',
                    },
                }}
            >
                <ListItemIcon sx={{ minWidth: 32 }}>
                    <HomeIcon fontSize="small" color={isOverview ? 'primary' : 'action'} />
                </ListItemIcon>
                <ListItemText
                    primary="Overview"
                    primaryTypographyProps={{ variant: 'body2', fontWeight: isOverview ? 600 : 400 }}
                />
            </ListItemButton>

            {/* Scrollable Curriculum Tree */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
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
