import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import CurriculumTree from './CurriculumTree';

const CourseSidebar = ({ program, progress, curriculum, activeNodeId, enrollmentId }) => {
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
