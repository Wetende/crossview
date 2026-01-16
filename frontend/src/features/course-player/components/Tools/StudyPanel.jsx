import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Box, Typography, IconButton, Button, TextField, Link } from '@mui/material';
import { Close as CloseIcon, AddCircleOutline, Send as SendIcon } from '@mui/icons-material';
import DiscussionsList from './DiscussionsList';

const StudyPanel = ({ nodeId, enrollmentId, discussions = [], onClose }) => {
    const [isComposing, setIsComposing] = useState(false);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSend = () => {
        if (!message.trim() || isSubmitting) return;
        
        setIsSubmitting(true);
        
        // Use Inertia to post the comment
        router.post(`/student/programs/${enrollmentId}/session/${nodeId}/discussion/`, {
            content: message.trim()
        }, {
            preserveScroll: true,
            only: ['discussions'],
            onSuccess: () => {
                setMessage('');
                setIsComposing(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const handleCancel = () => {
        setMessage('');
        setIsComposing(false);
    };

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

            {/* Comment Section */}
            {isComposing ? (
                /* Comment Input Form */
                <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                    <TextField
                        multiline
                        rows={4}
                        fullWidth
                        placeholder="Enter message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        variant="outlined"
                        disabled={isSubmitting}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                bgcolor: 'background.paper',
                            }
                        }}
                    />
                    
                    {/* Send Button & Cancel */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
                        <Link 
                            component="button"
                            variant="body2"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                            sx={{ 
                                color: 'primary.main', 
                                textDecoration: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </Link>
                        
                        <IconButton 
                            onClick={handleSend}
                            disabled={!message.trim() || isSubmitting}
                            sx={{ 
                                bgcolor: 'primary.main',
                                color: 'white',
                                '&:hover': { bgcolor: 'primary.dark' },
                                '&.Mui-disabled': { bgcolor: 'grey.300', color: 'grey.500' }
                            }}
                        >
                            <SendIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>
            ) : (
                /* Comment Button - Right aligned */
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1.5 }}>
                    <Button 
                        variant="outlined" 
                        size="small"
                        startIcon={<AddCircleOutline sx={{ fontSize: 16 }} />}
                        onClick={() => setIsComposing(true)}
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
            )}

            {/* Discussions Content */}
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <DiscussionsList discussions={discussions} />
            </Box>
        </Box>
    );
};

export default StudyPanel;
