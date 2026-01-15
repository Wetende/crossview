import React from 'react';
import { Box, Typography } from '@mui/material';

const LessonHeader = ({ title, type, node }) => {
    // Get lesson type label from various sources
    const getTypeLabel = () => {
        const lessonType = type || node?.properties?.lesson_type || node?.lessonType || node?.nodeType || 'text';
        switch (lessonType.toLowerCase()) {
            case 'video':
            case 'video_lesson':
                return 'Video lesson';
            case 'quiz':
                return 'Quiz';
            case 'assignment':
                return 'Assignment';
            case 'practicum':
                return 'Practicum';
            default:
                return 'Text lesson';
        }
    };

    return (
        <Box sx={{ mb: 4 }}>
            {/* Lesson Type Label */}
            <Typography 
                variant="caption" 
                color="primary.main"
                fontWeight={500}
                sx={{ textTransform: 'capitalize', letterSpacing: 0.3 }}
            >
                {getTypeLabel()}
            </Typography>
            
            {/* Lesson Title */}
            <Typography 
                variant="h4" 
                component="h1" 
                fontWeight={700}
                sx={{ mt: 0.5, lineHeight: 1.3 }}
            >
                {title}
            </Typography>
        </Box>
    );
};

export default LessonHeader;
