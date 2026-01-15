import React from 'react';
import { Box, Typography, IconButton, Button } from '@mui/material';
import { Close as CloseIcon, AddCircleOutline } from '@mui/icons-material';
import DiscussionsList from './DiscussionsList';

const StudyPanel = ({ nodeId, onClose }) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#f8f9fb' }}>
            {/* Header */}
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                p: 1.5,
                bgcolor: 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Typography variant="body1" fontWeight={600}>
                    Discussions
                </Typography>
                
                <IconButton size="small" onClick={onClose}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Comment Button - Small outlined, right-aligned */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1.5 }}>
                <Button 
                    variant="outlined" 
                    size="small"
                    startIcon={<AddCircleOutline sx={{ fontSize: 16 }} />}
                    sx={{ 
                        textTransform: 'none',
                        borderRadius: 5,
                        px: 2,
                        py: 0.5,
                        fontSize: '0.813rem',
                        fontWeight: 500
                    }}
                >
                    Comment
                </Button>
            </Box>

            {/* Discussions Content */}
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <DiscussionsList nodeId={nodeId} />
            </Box>
        </Box>
    );
};

export default StudyPanel;
