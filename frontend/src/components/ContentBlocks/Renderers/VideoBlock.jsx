import React from 'react';
import { Box } from '@mui/material';
import ReactPlayer from 'react-player';

const VideoBlock = ({ data }) => {
    if (!data || !data.url) return null;

    return (
        <Box sx={{ width: '100%', height: '400px', mb: 3, borderRadius: 2, overflow: 'hidden', bgcolor: 'black' }}>
            <ReactPlayer 
                url={data.url} 
                width="100%" 
                height="100%" 
                controls 
            />
        </Box>
    );
};

export default VideoBlock;
