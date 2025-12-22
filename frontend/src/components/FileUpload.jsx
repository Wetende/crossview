/**
 * File Upload Component
 * Requirements: 6.1, 6.2, 6.3
 */

import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Alert,
  Stack,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({
  allowedTypes = ['mp3', 'mp4', 'pdf'],
  maxSizeMb = 100,
  onFileSelect,
  uploading = false,
  uploadProgress = 0,
  error = null,
}) {
  const [file, setFile] = useState(null);
  const [validationError, setValidationError] = useState(null);

  const validateFile = useCallback((file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(extension)) {
      return `File type .${extension} is not allowed. Allowed: ${allowedTypes.join(', ')}`;
    }

    const maxSizeBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size exceeds maximum of ${maxSizeMb}MB`;
    }

    return null;
  }, [allowedTypes, maxSizeMb]);

  const handleFileSelect = (selectedFile) => {
    const error = validateFile(selectedFile);
    if (error) {
      setValidationError(error);
      setFile(null);
      return;
    }

    setValidationError(null);
    setFile(selectedFile);
    onFileSelect?.(selectedFile);
  };

  const handleInputChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleClear = () => {
    setFile(null);
    setValidationError(null);
    onFileSelect?.(null);
  };

  const displayError = validationError || error;

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Allowed: {allowedTypes.join(', ').toUpperCase()} • Max size: {maxSizeMb}MB
      </Typography>

      <Box
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        sx={{
          border: '2px dashed',
          borderColor: file ? 'primary.main' : displayError ? 'error.main' : 'grey.300',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          bgcolor: file ? 'primary.50' : 'grey.50',
          cursor: uploading ? 'default' : 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: uploading ? undefined : 'primary.main',
            bgcolor: uploading ? undefined : 'primary.50',
          },
        }}
        component="label"
      >
        <input
          type="file"
          hidden
          accept={allowedTypes.map(t => `.${t}`).join(',')}
          onChange={handleInputChange}
          disabled={uploading}
        />

        {file ? (
          <Stack alignItems="center" spacing={1}>
            <Box sx={{ position: 'relative' }}>
              <FileIcon sx={{ fontSize: 48, color: 'primary.main' }} />
              {!uploading && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.preventDefault();
                    handleClear();
                  }}
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            <Typography variant="body1">{file.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {formatFileSize(file.size)}
            </Typography>
          </Stack>
        ) : (
          <Stack alignItems="center" spacing={1}>
            <UploadIcon sx={{ fontSize: 48, color: 'grey.400' }} />
            <Typography variant="body1">
              Drag and drop your file here, or click to browse
            </Typography>
          </Stack>
        )}
      </Box>

      {displayError && (
        <Alert severity="error">{displayError}</Alert>
      )}

      {uploading && (
        <Box>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Uploading... {uploadProgress}%
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
