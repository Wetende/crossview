import React, { useState, useEffect } from 'react';
import { Box, Paper, IconButton, Typography, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ThreadList from './ThreadList';
import ThreadDetail from './ThreadDetail';

const DiscussionPanel = ({ nodeId, onClose }) => {
    const [selectedThread, setSelectedThread] = useState(null);

    return (
        <Paper 
            sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderLeft: '1px solid #ddd',
                width: 400, // Fixed width or flexible
                position: 'fixed',
                right: 0,
                top: 64, // below header
                bottom: 0,
                zIndex: 1200
            }}
            elevation={3}
        >
            <Box sx={{ p: 2, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {selectedThread && (
                        <IconButton size="small" onClick={() => setSelectedThread(null)} sx={{ mr: 1 }}>
                            <ArrowBackIcon />
                        </IconButton>
                    )}
                    <Typography variant="h6">
                        {selectedThread ? 'Thread' : 'Q&A'}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                {!selectedThread ? (
                    <ThreadList 
                        nodeId={nodeId} 
                        onSelectThread={setSelectedThread} 
                    />
                ) : (
                    <ThreadDetail 
                        thread={selectedThread} 
                        onBack={() => setSelectedThread(null)} 
                    />
                )}
            </Box>
        </Paper>
    );
};

export default DiscussionPanel;
