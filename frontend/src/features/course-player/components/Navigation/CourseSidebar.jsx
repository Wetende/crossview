import { Link } from '@inertiajs/react';
import { Box, Typography, LinearProgress, Link as MuiLink, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Home as HomeIcon, TaskAltOutlined } from '@mui/icons-material';
import CurriculumTree from './CurriculumTree';

const CourseSidebar = ({ program, progress, curriculum, activeNodeId, enrollmentId, activeView, completionUrl = null }) => {
    const isOverview = activeView === 'overview';
    const isCourseSummary = activeView === 'course_complete';
    const overviewUrl = program?.id ? `/student/programs/${program.id}/` : '#';

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, bgcolor: 'background.paper' }}>
            {/* Course Title & Progress */}
            <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                <Typography 
                    variant="subtitle1" 
                    color="textPrimary"
                    sx={{
                        fontWeight: 700,
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
                        height: 6, 
                        borderRadius: 3, 
                        bgcolor: 'grey.200',
                        mb: 0.5,
                        '& .MuiLinearProgress-bar': { 
                            borderRadius: 3,
                            bgcolor: 'primary.main'
                        }
                    }} 
                />
                
                <Typography variant="caption" color="textSecondary">
                    Course progress: {Math.round(progress)}%
                </Typography>

                {completionUrl && (
                    <MuiLink
                        component={Link}
                        href={completionUrl}
                        variant="caption"
                        underline="hover"
                        aria-current={isCourseSummary ? 'page' : undefined}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mt: 0.5,
                            width: 'fit-content',
                            fontWeight: 600,
                        }}
                    >
                        <TaskAltOutlined aria-hidden="true" sx={{ fontSize: 14 }} />
                        Course completed · View summary
                    </MuiLink>
                )}
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
                        slotProps={{ primary: { variant: 'body2', noWrap: true, sx: { fontWeight: isOverview ? 600 : 400 } } }}
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
