import React from 'react';
import { Box, Typography, Avatar, List, ListItem, ListItemAvatar, ListItemText, Divider, Chip } from '@mui/material';
import { ChatBubbleOutline, PushPin } from '@mui/icons-material';

const DiscussionsList = ({ discussions = [] }) => {
    // Format relative time
    const formatTime = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (!discussions || discussions.length === 0) {
        return (
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                p: 4,
                textAlign: 'center' 
            }}>
                <Box sx={{ 
                    bgcolor: 'primary.lighter', 
                    borderRadius: '50%', 
                    p: 2, 
                    mb: 2 
                }}>
                    <ChatBubbleOutline sx={{ fontSize: 32, color: 'primary.main' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    No discussions yet...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Here you can ask a question or discuss a topic
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ overflowY: 'auto', height: '100%' }}>
            <List disablePadding>
                {discussions.map((thread, index) => (
                    <React.Fragment key={thread.id}>
                        <ListItem 
                            alignItems="flex-start" 
                            sx={{ 
                                px: 2, 
                                py: 2,
                                bgcolor: 'background.paper',
                                flexDirection: 'column'
                            }}
                        >
                            {/* Thread Header */}
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', fontSize: 14, mr: 1 }}>
                                    {thread.user?.name?.[0] || '?'}
                                </Avatar>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="subtitle2" fontWeight={600}>
                                        {thread.user?.name || 'Anonymous'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {formatTime(thread.createdAt)}
                                    </Typography>
                                </Box>
                                {thread.isPinned && (
                                    <Chip 
                                        icon={<PushPin sx={{ fontSize: 14 }} />}
                                        label="Pinned" 
                                        size="small" 
                                        variant="outlined"
                                        sx={{ height: 22 }}
                                    />
                                )}
                            </Box>

                            {/* Thread Content */}
                            {thread.title && (
                                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                                    {thread.title}
                                </Typography>
                            )}
                            <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
                                {thread.content}
                            </Typography>

                            {/* Replies */}
                            {thread.posts && thread.posts.length > 0 && (
                                <Box sx={{ pl: 4, pt: 1, width: '100%' }}>
                                    {thread.posts.map((post) => (
                                        <Box key={post.id} sx={{ mb: 1.5, display: 'flex', gap: 1 }}>
                                            <Avatar sx={{ width: 24, height: 24, fontSize: 11 }}>
                                                {post.user?.name?.[0] || '?'}
                                            </Avatar>
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="caption" fontWeight={600}>
                                                        {post.user?.name || 'Anonymous'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatTime(post.createdAt)}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2">
                                                    {post.content}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </ListItem>
                        {index < discussions.length - 1 && <Divider />}
                    </React.Fragment>
                ))}
            </List>
        </Box>
    );
};

export default DiscussionsList;
