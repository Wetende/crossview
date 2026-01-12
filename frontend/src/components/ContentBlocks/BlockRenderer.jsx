import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import VideoBlock from './Renderers/VideoBlock';
import RichTextBlock from './Renderers/RichTextBlock';
import QuizIcon from '@mui/icons-material/Quiz';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Link } from '@inertiajs/react';

// Placeholder renderers for now
const QuizBlock = ({ data }) => (
    <Paper sx={{ p: 3, mb: 3, borderLeft: '4px solid #1976d2' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <QuizIcon color="primary" fontSize="large" />
            <Box>
                <Typography variant="h6">Quiz: {data.quiz_title || 'Attached Quiz'}</Typography>
                <Typography variant="body2" color="text.secondary">Test your knowledge.</Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            {data.quiz_id && (
                <Button 
                    variant="contained" 
                    component={Link} 
                    href={`/student/quiz/${data.quiz_id}/`}
                >
                    Start Quiz
                </Button>
            )}
        </Box>
    </Paper>
);

const AssignmentBlock = ({ data }) => (
    <Paper sx={{ p: 3, mb: 3, borderLeft: '4px solid #ed6c02' }}>
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AssignmentIcon color="warning" fontSize="large" />
            <Box>
                <Typography variant="h6">Assignment: {data.assignment_title || 'Attached Assignment'}</Typography>
                <Typography variant="body2" color="text.secondary">Submit your work.</Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            {data.assignment_id && (
                <Button 
                    variant="contained" 
                    color="warning"
                    component={Link} 
                    href={`/student/assignment/${data.assignment_id}/`}
                >
                    View Assignment
                </Button>
            )}
        </Box>
    </Paper>
);

const BlockRenderer = ({ blocks }) => {
    if (!blocks || blocks.length === 0) return null;

    return (
        <Box>
            {blocks.map((block) => {
                switch (block.type) {
                    case 'VIDEO':
                        return <VideoBlock key={block.id} data={block.data} />;
                    case 'RICHTEXT':
                        return <RichTextBlock key={block.id} data={block.data} />;
                    case 'QUIZ':
                        return <QuizBlock key={block.id} data={block.data} />;
                    case 'ASSIGNMENT':
                        return <AssignmentBlock key={block.id} data={block.data} />;
                    default:
                        // Fallback for unknown types or future types
                        return (
                            <Typography key={block.id} color="error" sx={{ mb: 2 }}>
                                Unsupported block type: {block.type}
                            </Typography>
                        );
                }
            })}
        </Box>
    );
};

export default BlockRenderer;
