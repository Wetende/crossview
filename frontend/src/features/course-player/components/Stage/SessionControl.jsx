import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import {
    NavigateBefore,
    NavigateNext,
    CheckCircle
} from '@mui/icons-material';

const SessionControl = ({ prevNode, nextNode, onNavigate, onComplete, isCompleted }) => {
    return (
        <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 2,
            mt: 4,
            borderTop: '1px solid',
            borderColor: 'divider'
        }}>
            {/* Previous Button */}
            <Button
                disabled={!prevNode}
                onClick={prevNode ? () => onNavigate(prevNode) : undefined}
                startIcon={<NavigateBefore />}
                sx={{ 
                    color: 'text.secondary',
                    textTransform: 'none',
                    '&:hover': { bgcolor: 'transparent', color: 'text.primary' }
                }}
            >
                Previous
            </Button>

            {/* Center: Completed Status */}
            <Button
                variant="text"
                onClick={onComplete}
                startIcon={<CheckCircle />}
                sx={{ 
                    color: isCompleted ? 'primary.main' : 'text.secondary',
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': { bgcolor: 'transparent' }
                }}
            >
                Completed
            </Button>

            {/* Next Button */}
            <Button
                disabled={!nextNode}
                onClick={nextNode ? () => onNavigate(nextNode) : undefined}
                endIcon={<NavigateNext />}
                sx={{ 
                    color: 'text.secondary',
                    textTransform: 'none',
                    '&:hover': { bgcolor: 'transparent', color: 'text.primary' }
                }}
            >
                Next
            </Button>
        </Box>
    );
};

export default SessionControl;
