import React from 'react';
import { Box, Typography, Avatar, List, ListItem, ListItemAvatar, ListItemText, Divider } from '@mui/material';
import { ChatBubbleOutline } from '@mui/icons-material';

const DiscussionsList = ({ nodeId }) => {
    // Mock Data - will be replaced with API call
    const discussions = [];

    if (discussions.length === 0) {
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
                <ChatBubbleOutline sx={{ fontSize: 48, color: 'primary.main', opacity: 0.6, mb: 2 }} />
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
                {discussions.map((msg, index) => (
                    <React.Fragment key={msg.id}>
                        <ListItem alignItems="flex-start" sx={{ px: 2, py: 2 }}>
                            <ListItemAvatar>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.light', fontSize: 14 }}>
                                    {msg.user[0]}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            {msg.user}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {msg.time}
                                        </Typography>
                                    </Box>
                                }
                                secondary={
                                    <Typography variant="body2" color="text.primary">
                                        {msg.text}
                                    </Typography>
                                }
                            />
                        </ListItem>
                        {index < discussions.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                ))}
            </List>
        </Box>
    );
};

export default DiscussionsList;
