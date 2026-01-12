import React, { useState, useEffect } from 'react';
import { Box, TextField, MenuItem, Typography } from '@mui/material';
import ReactPlayer from 'react-player';

const VideoBlockEditor = ({ data, onChange }) => {
    const [url, setUrl] = useState(data.url || '');
    // const [provider, setProvider] = useState(data.provider || 'youtube'); // Auto-detect usually better

    useEffect(() => {
        // Debounce or direct update
        onChange({ ...data, url });
    }, [url]);

    return (
        <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>Video Settings</Typography>
            <TextField
                fullWidth
                label="Video URL (YouTube, Vimeo, etc.)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
            />
            
            {url && ReactPlayer.canPlay(url) && (
                <Box sx={{ mt: 2, borderRadius: 2, overflow: 'hidden', height: 200, bgcolor: 'black' }}>
                    <ReactPlayer url={url} width="100%" height="100%" light controls />
                </Box>
            )}
            
            {!url && (
                <Typography variant="caption" color="text.secondary">
                    Paste a URL to see a preview.
                </Typography>
            )}
        </Box>
    );
};

export default VideoBlockEditor;
