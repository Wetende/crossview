import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { 
    Box, 
    Typography, 
    IconButton, 
    Button, 
    TextField, 
    Link, 
    Tabs, 
    Tab,
    List,
    ListItem,
    ListItemText,
    Divider
} from '@mui/material';
import { 
    Close as CloseIcon, 
    AddCircleOutline, 
    Send as SendIcon,
    Delete as DeleteIcon,
    NoteAlt as NoteIcon
} from '@mui/icons-material';
import DiscussionsList from './DiscussionsList';

const StudyPanel = ({ nodeId, enrollmentId, discussions = [], notes = [], currentVideoTimestamp, onClose }) => {
    const [activeTab, setActiveTab] = useState(0); // 0 = Discussions, 1 = Notes
    const [isComposing, setIsComposing] = useState(false);
    const [message, setMessage] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        setIsComposing(false);
        setMessage('');
        setNoteContent('');
    };

    // --- Discussion Handlers ---
    const handleSendDiscussion = () => {
        if (!message.trim() || isSubmitting) return;
        
        setIsSubmitting(true);
        
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

    // --- Note Handlers ---
    const handleSaveNote = () => {
        if (!noteContent.trim() || isSubmitting) return;
        
        setIsSubmitting(true);
        
        const noteData = {
            content: noteContent.trim()
        };
        
        // Include video timestamp if available
        if (currentVideoTimestamp !== null && currentVideoTimestamp !== undefined) {
            noteData.video_timestamp = currentVideoTimestamp;
        }
        
        router.post(`/student/programs/${enrollmentId}/session/${nodeId}/notes/`, noteData, {
            preserveScroll: true,
            only: ['notes'],
            onSuccess: () => {
                setNoteContent('');
                setIsComposing(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const handleDeleteNote = (noteId) => {
        if (isSubmitting) return;
        
        router.delete(`/student/programs/${enrollmentId}/session/${nodeId}/notes/${noteId}/`, {
            preserveScroll: true,
            only: ['notes']
        });
    };

    const handleCancel = () => {
        setMessage('');
        setNoteContent('');
        setIsComposing(false);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#f8f9fb' }}>
            {/* Header */}
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                px: 1.5,
                pt: 1,
                bgcolor: 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange}
                    sx={{ minHeight: 40 }}
                >
                    <Tab label="Discussions" sx={{ minHeight: 40, py: 0 }} />
                    <Tab label="Notes" sx={{ minHeight: 40, py: 0 }} />
                </Tabs>
                
                <IconButton size="small" onClick={onClose}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Tab Content */}
            {activeTab === 0 ? (
                /* Discussions Tab */
                <>
                    {/* Comment Section */}
                    {isComposing ? (
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
                                    onClick={handleSendDiscussion}
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

                    <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                        <DiscussionsList discussions={discussions} />
                    </Box>
                </>
            ) : (
                /* Notes Tab */
                <>
                    {/* Add Note Section */}
                    {isComposing ? (
                        <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                            <TextField
                                multiline
                                rows={4}
                                fullWidth
                                placeholder="Write your note..."
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                variant="outlined"
                                disabled={isSubmitting}
                            />
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
                                <Link 
                                    component="button"
                                    variant="body2"
                                    onClick={handleCancel}
                                    disabled={isSubmitting}
                                    sx={{ color: 'primary.main', textDecoration: 'none', cursor: 'pointer' }}
                                >
                                    Cancel
                                </Link>
                                
                                <Button 
                                    variant="contained"
                                    size="small"
                                    onClick={handleSaveNote}
                                    disabled={!noteContent.trim() || isSubmitting}
                                >
                                    Save Note
                                </Button>
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1.5 }}>
                            <Button 
                                variant="outlined" 
                                size="small"
                                startIcon={<NoteIcon sx={{ fontSize: 16 }} />}
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
                                Add Note
                            </Button>
                        </Box>
                    )}

                    {/* Notes List */}
                    <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
                        {notes.length === 0 ? (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography color="text.secondary" variant="body2">
                                    No notes yet. Add your first note!
                                </Typography>
                            </Box>
                        ) : (
                            <List disablePadding>
                                {notes.map((note, index) => (
                                    <React.Fragment key={note.id}>
                                        <ListItem 
                                            alignItems="flex-start"
                                            secondaryAction={
                                                <IconButton 
                                                    edge="end" 
                                                    size="small"
                                                    onClick={() => handleDeleteNote(note.id)}
                                                    sx={{ color: 'error.light' }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            }
                                            sx={{ bgcolor: 'background.paper', borderRadius: 1, mb: 1 }}
                                        >
                                            <ListItemText
                                                primary={note.content}
                                                secondary={
                                                    <>
                                                        {formatDate(note.createdAt)}
                                                        {note.videoTimestamp && (
                                                            <Typography 
                                                                component="span" 
                                                                variant="caption" 
                                                                color="primary"
                                                                sx={{ ml: 1 }}
                                                            >
                                                                @ {Math.floor(note.videoTimestamp / 60)}:{String(note.videoTimestamp % 60).padStart(2, '0')}
                                                            </Typography>
                                                        )}
                                                    </>
                                                }
                                                primaryTypographyProps={{ variant: 'body2', sx: { whiteSpace: 'pre-wrap' } }}
                                            />
                                        </ListItem>
                                        {index < notes.length - 1 && <Divider component="li" />}
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                    </Box>
                </>
            )}
        </Box>
    );
};

export default StudyPanel;

