import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Avatar, Divider, CircularProgress } from '@mui/material';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const ThreadDetail = ({ thread, onBack }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyContent, setReplyContent] = useState('');

    useEffect(() => {
        fetchPosts();
    }, [thread.id]);

    const fetchPosts = async () => {
        try {
            const res = await axios.get(`/api/discussions/posts/?thread=${thread.id}`);
            setPosts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/discussions/posts/', {
                thread: thread.id,
                content: replyContent
            });
            setReplyContent('');
            fetchPosts(); 
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Box>
            {/* Thread Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>{thread.title}</Typography>
                <Typography variant="body1" paragraph>{thread.content}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                        {thread.user?.first_name?.[0] || 'U'}
                     </Avatar>
                     <Typography variant="caption" color="text.secondary">
                        {thread.user?.first_name || 'User'} • {formatDistanceToNow(new Date(thread.created_at))} ago
                     </Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Posts List */}
            <Box sx={{ mb: 4 }}>
                {loading ? <CircularProgress size={20} /> : (
                    posts.map(post => (
                        <Box key={post.id} sx={{ mb: 2, pl: 2, borderLeft: '2px solid #eee' }}>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="subtitle2" sx={{ fontSize: '0.85rem' }}>
                                    {post.user?.first_name || post.user?.username || 'User'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {formatDistanceToNow(new Date(post.created_at))} ago
                                </Typography>
                             </Box>
                             <Typography variant="body2">{post.content}</Typography>
                        </Box>
                    ))
                )}
            </Box>

            {/* Reply Form */}
            <Box component="form" onSubmit={handleReply} sx={{ position: 'sticky', bottom: 0, bgcolor: 'white', pt: 1 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Write a reply..."
                    multiline
                    maxRows={4}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    InputProps={{
                        endAdornment: (
                            <Button type="submit" variant="contained" size="small" disabled={!replyContent.trim()} sx={{ ml: 1 }}>
                                Send
                            </Button>
                        )
                    }}
                />
            </Box>
        </Box>
    );
};

export default ThreadDetail;
