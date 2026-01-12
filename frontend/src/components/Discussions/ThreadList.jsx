import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Button, TextField, Chip, Alert } from '@mui/material';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const ThreadList = ({ nodeId, onSelectThread }) => {
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewForm, setShowNewForm] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');

    useEffect(() => {
        fetchThreads();
    }, [nodeId]);

    const fetchThreads = async () => {
        try {
            const res = await axios.get(`/api/discussions/threads/?node=${nodeId}`);
            setThreads(res.data);
        } catch (err) {
            console.error("Failed to fetch threads", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateThread = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/discussions/threads/', {
                node: nodeId,
                title: newTitle,
                content: newContent
            });
            setShowNewForm(false);
            setNewTitle('');
            setNewContent('');
            fetchThreads(); // optimize later
        } catch (err) {
            console.error("Failed to create thread", err);
        }
    };

    if (loading) return <Typography>Loading...</Typography>;

    return (
        <Box>
            {!showNewForm ? (
                <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={() => setShowNewForm(true)}
                    sx={{ mb: 2 }}
                >
                    Start New Discussion
                </Button>
            ) : (
                <Box component="form" onSubmit={handleCreateThread} sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>New Question</Typography>
                    <TextField 
                        fullWidth size="small" label="Title" 
                        value={newTitle} onChange={e => setNewTitle(e.target.value)}
                        required sx={{ mb: 2 }}
                    />
                    <TextField 
                        fullWidth size="small" label="Details" multiline rows={3}
                        value={newContent} onChange={e => setNewContent(e.target.value)}
                        required sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button type="submit" variant="contained" size="small">Post</Button>
                        <Button onClick={() => setShowNewForm(false)} size="small">Cancel</Button>
                    </Box>
                </Box>
            )}

            {threads.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>No questions yet. Be the first!</Alert>
            ) : (
                threads.map(thread => (
                    <Card 
                        key={thread.id} 
                        sx={{ mb: 2, cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                        onClick={() => onSelectThread(thread)}
                    >
                        <CardContent sx={{ p: '16px !important' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    {thread.title}
                                </Typography>
                                {thread.is_pinned && <Chip label="Pinned" size="small" color="primary" />}
                            </Box>
                            <Typography variant="body2" color="text.secondary" noWrap>
                                {thread.content}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
                                <span>{thread.user?.first_name || thread.user?.username || 'User'}</span>
                                <span>{thread.posts_count} replies • {formatDistanceToNow(new Date(thread.latest_post_at))} ago</span>
                            </Box>
                        </CardContent>
                    </Card>
                ))
            )}
        </Box>
    );
};

export default ThreadList;
