/**
 * MediaPlayer Component
 * Supports audio, video, and PDF viewing
 * Requirements: FR-5.2, FR-5.3
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  IconButton,
  Stack,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import DownloadIcon from '@mui/icons-material/Download';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

export default function MediaPlayer({ url, type, title }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLoad = () => setLoading(false);
  const handleError = () => {
    setLoading(false);
    setError('Failed to load media');
  };

  // Determine media type from file extension if not provided
  const mediaType = type || getMediaType(url);

  const renderMedia = () => {
    switch (mediaType) {
      case 'audio':
        return (
          <Box sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <AudioFileIcon sx={{ fontSize: 48, color: 'primary.main' }} />
              <Typography variant="h6">{title || 'Audio File'}</Typography>
            </Stack>
            <audio
              controls
              style={{ width: '100%' }}
              onLoadedData={handleLoad}
              onError={handleError}
            >
              <source src={url} />
              Your browser does not support audio playback.
            </audio>
          </Box>
        );

      case 'video':
        return (
          <Box sx={{ position: 'relative', bgcolor: 'black' }}>
            {loading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1,
                }}
              >
                <CircularProgress />
              </Box>
            )}
            <video
              controls
              style={{ width: '100%', maxHeight: '70vh' }}
              onLoadedData={handleLoad}
              onError={handleError}
            >
              <source src={url} />
              Your browser does not support video playback.
            </video>
          </Box>
        );

      case 'pdf':
        return (
          <Box sx={{ height: '70vh' }}>
            {loading && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <CircularProgress />
              </Box>
            )}
            <iframe
              src={`${url}#toolbar=1`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: loading ? 'none' : 'block',
              }}
              onLoad={handleLoad}
              onError={handleError}
              title={title || 'PDF Document'}
            />
          </Box>
        );

      default:
        return (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Unsupported file type. 
            </Typography>
            <IconButton
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ mt: 2 }}
            >
              <DownloadIcon />
            </IconButton>
            <Typography variant="caption" display="block">
              Download file
            </Typography>
          </Box>
        );
    }
  };

  if (error) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <IconButton
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ mt: 2 }}
        >
          <DownloadIcon />
        </IconButton>
        <Typography variant="caption" display="block">
          Try downloading instead
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      {renderMedia()}
    </Paper>
  );
}

function getMediaType(url) {
  if (!url) return 'unknown';
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
  
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video';
  if (ext === 'pdf') return 'pdf';
  
  return 'unknown';
}

MediaPlayer.propTypes = {
  url: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['audio', 'video', 'pdf']),
  title: PropTypes.string,
};
