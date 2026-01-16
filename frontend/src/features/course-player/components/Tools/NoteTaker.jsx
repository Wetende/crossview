import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Box, Typography, TextField, Button, List, IconButton, Paper } from '@mui/material';
import { Delete as DeleteIcon, AccessTime as TimeIcon, Save as SaveIcon } from '@mui/icons-material';

const NoteTaker = ({ nodeId, enrollmentId, notes = [], currentTime = 0, onSeek }) => {
    const [noteText, setNoteText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatTime = (seconds) => {
        if (seconds === null || seconds === undefined) return '';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSaveNote = () => {
        if (!noteText.trim() || isSubmitting) return;
        
        setIsSubmitting(true);
        
        router.post(`/student/programs/${enrollmentId}/session/${nodeId}/notes/`, {
            content: noteText.trim(),
            video_timestamp: Math.floor(currentTime) || null
        }, {
            preserveScroll: true,
            only: ['notes'],
            onSuccess: () => {
                setNoteText('');
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const handleDelete = (noteId) => {
        router.post(`/student/programs/${enrollmentId}/session/${nodeId}/notes/${noteId}/delete/`, {}, {
            preserveScroll: true,
            only: ['notes']
        });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Input Area */}
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    maxRows={4}
                    placeholder="Type your note here..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    variant="outlined"
                    size="small"
                    disabled={isSubmitting}
                    sx={{ mb: 1, bgcolor: 'grey.50' }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button 
                        size="small" 
                        startIcon={<TimeIcon />} 
                        sx={{ color: 'text.secondary', textTransform: 'none' }}
                        disabled
                    >
                        At {formatTime(currentTime)}
                    </Button>
                    <Button 
                        variant="contained" 
                        size="small" 
                        startIcon={<SaveIcon />}
                        onClick={handleSaveNote}
                        disabled={!noteText.trim() || isSubmitting}
                    >
                        {isSubmitting ? 'Saving...' : 'Save Note'}
                    </Button>
                </Box>
            </Box>

            {/* Notes List */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                {(!notes || notes.length === 0) ? (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
                        No notes yet. Start typing above to add one!
                    </Typography>
                ) : (
                    <List disablePadding>
                        {notes.map((note) => (
                            <Paper 
                                key={note.id} 
                                elevation={0} 
                                variant="outlined" 
                                sx={{ mb: 2, p: 1.5, borderRadius: 2, position: 'relative' }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    {note.videoTimestamp !== null && note.videoTimestamp !== undefined && (
                                        <Button
                                            size="small"
                                            startIcon={<TimeIcon fontSize="inherit" />}
                                            onClick={() => onSeek && onSeek(note.videoTimestamp)}
                                            sx={{ 
                                                minWidth: 'auto', 
                                                p: 0.5, 
                                                mr: 1, 
                                                fontSize: '0.75rem',
                                                bgcolor: 'primary.lighter',
                                                color: 'primary.main',
                                                '&:hover': { bgcolor: 'primary.light' }
                                            }}
                                        >
                                            {formatTime(note.videoTimestamp)}
                                        </Button>
                                    )}
                                    <Box sx={{ flexGrow: 1 }} />
                                    <IconButton size="small" onClick={() => handleDelete(note.id)} sx={{ p: 0.5 }}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                                <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                                    {note.content}
                                </Typography>
                            </Paper>
                        ))}
                    </List>
                )}
            </Box>
        </Box>
    );
};

export default NoteTaker;
