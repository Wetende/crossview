import React, { useState, useCallback, useRef } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    LinearProgress,
    Alert
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    InsertDriveFile as FileIcon,
    Delete as DeleteIcon,
    Description as DocIcon,
    PictureAsPdf as PdfIcon,
    Image as ImageIcon,
    VideoFile as VideoFileIcon
} from '@mui/icons-material';

const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext)) return <PdfIcon color="error" />;
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return <DocIcon color="primary" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return <ImageIcon color="success" />;
    if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return <VideoFileIcon color="secondary" />;
    return <FileIcon color="action" />;
};

const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function FileUploader({ nodeId, files = [], onUploadComplete, onDeleteComplete }) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const uploadFile = async (file) => {
        setUploading(true);
        setError(null);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`/instructor/nodes/${nodeId}/files/upload/`, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
                                   document.cookie.match(/csrftoken=([^;]+)/)?.[1] || ''
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Upload failed');
            }

            const data = await response.json();
            if (onUploadComplete) {
                onUploadComplete(data.file);
            }
            setUploadProgress(100);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
            uploadFile(droppedFiles[0]);
        }
    }, [nodeId]);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            uploadFile(selectedFile);
        }
    };

    const handleDelete = async (fileId) => {
        if (!confirm('Delete this file?')) return;

        try {
            const response = await fetch(`/instructor/nodes/${nodeId}/files/delete/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value ||
                                   document.cookie.match(/csrftoken=([^;]+)/)?.[1] || ''
                },
                body: JSON.stringify({ file_id: fileId })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Delete failed');
            }

            if (onDeleteComplete) {
                onDeleteComplete(fileId);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Box>
            {/* Drop Zone */}
            <Paper
                variant="outlined"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                    p: 4,
                    borderStyle: 'dashed',
                    borderColor: isDragging ? 'primary.main' : 'divider',
                    bgcolor: isDragging ? 'primary.lighter' : '#f8f9fa',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: '#f0f0f0', borderColor: 'primary.light' }
                }}
            >
                <UploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Drag & drop files here or click to browse
                </Typography>
                <Button 
                    variant="contained" 
                    size="small" 
                    sx={{ mt: 1, textTransform: 'none' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                    }}
                >
                    Browse files
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    onChange={handleFileSelect}
                />
            </Paper>

            {/* Upload Progress */}
            {uploading && (
                <Box sx={{ mt: 2 }}>
                    <LinearProgress variant="determinate" value={uploadProgress} />
                    <Typography variant="caption" color="text.secondary">
                        Uploading...
                    </Typography>
                </Box>
            )}

            {/* Error Message */}
            {error && (
                <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* File List */}
            {files.length > 0 && (
                <List dense sx={{ mt: 2 }}>
                    {files.map((file) => (
                        <ListItem
                            key={file.id}
                            sx={{
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 1,
                                mb: 1,
                                bgcolor: 'background.paper'
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                {getFileIcon(file.name)}
                            </ListItemIcon>
                            <ListItemText
                                primary={file.name}
                                secondary={formatFileSize(file.size)}
                                primaryTypographyProps={{ noWrap: true }}
                            />
                            <ListItemSecondaryAction>
                                <IconButton 
                                    edge="end" 
                                    size="small"
                                    onClick={() => handleDelete(file.id)}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            )}
        </Box>
    );
}
