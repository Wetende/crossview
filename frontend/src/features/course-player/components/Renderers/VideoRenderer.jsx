import React from 'react';
import ReactPlayer from 'react-player';
import { Box, Paper } from '@mui/material';

const VideoRenderer = ({ url, onEnded, onProgress }) => {
    return (
        <Paper 
            elevation={3} 
            sx={{ 
                overflow: 'hidden', 
                borderRadius: 3, 
                bgcolor: 'black', 
                position: 'relative',
                pt: '56.25%' // 16:9 Aspect Ratio
            }}
        >
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                <ReactPlayer
                    url={url}
                    width="100%"
                    height="100%"
                    controls={true}
                    onEnded={onEnded}
                    onProgress={onProgress}
                    config={{
                        youtube: {
                            playerVars: { showinfo: 0, modestbranding: 1 }
                        }
                    }}
                />
            </Box>
        </Paper>
    );
};

export default VideoRenderer;
