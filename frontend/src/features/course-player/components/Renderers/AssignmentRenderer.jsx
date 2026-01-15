import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Chip, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { CloudUpload as UploadIcon, InsertDriveFile as FileIcon, CheckCircle as CheckIcon, AccessTime as TimeIcon } from '@mui/icons-material';

const AssignmentRenderer = ({ assignment, onSubmit }) => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setUploadedFile(file);
        }
    };

    const handleSubmit = () => {
        // Mock API call
        setIsSubmitted(true);
        if (onSubmit) onSubmit({ file: uploadedFile });
    };

    if (isSubmitted) {
        return (
            <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 2, bgcolor: 'background.paper', minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ bgcolor: 'success.light', color: 'success.dark', p: 2, borderRadius: '50%', mb: 2 }}>
                    <CheckIcon sx={{ fontSize: 40 }} />
                </Box>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Assignment Submitted!
                </Typography>
                <Typography color="text.secondary" paragraph sx={{ maxWidth: 400 }}>
                    Your assignment has been successfully uploaded and is pending review by the instructor. You will be notified once it is graded.
                </Typography>
                <Button variant="outlined" onClick={() => setIsSubmitted(false)}>
                    View Submission
                </Button>
            </Paper>
        );
    }

    return (
        <Paper elevation={0} sx={{ p: { xs: 2, md: 5 }, borderRadius: 2, bgcolor: 'background.paper' }}>
            {/* Header Details */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Chip label="Assignment" size="small" color="primary" variant="outlined" />
                    <Chip icon={<TimeIcon />} label="Due: 3 Days" size="small" variant="outlined" />
                </Box>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    {assignment?.title || "Practical Assignment"}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {assignment?.description || "Read concepts text carefully and download the attached file. Fill it out and upload your solution below."}
                </Typography>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* Upload Area */}
            <Box 
                sx={{ 
                    border: '2px dashed', 
                    borderColor: 'grey.300', 
                    borderRadius: 3, 
                    p: 6, 
                    textAlign: 'center',
                    bgcolor: 'grey.50',
                    transition: 'all 0.2s',
                    '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'primary.lighter'
                    }
                }}
            >
                <input
                    accept=".pdf,.doc,.docx,.zip"
                    style={{ display: 'none' }}
                    id="raised-button-file"
                    type="file"
                    onChange={handleFileChange}
                />
                
                {uploadedFile ? (
                    <Box sx={{ mb: 2 }}>
                        <FileIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
                        <Typography variant="h6">{uploadedFile.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</Typography>
                        <Button color="error" size="small" onClick={() => setUploadedFile(null)} sx={{ mt: 1 }}>
                            Remove
                        </Button>
                    </Box>
                ) : (
                    <label htmlFor="raised-button-file">
                        <Box sx={{ cursor: 'pointer' }}>
                            <UploadIcon color="action" sx={{ fontSize: 48, mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                Drag and drop your file here
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                or click to browse
                            </Typography>
                            <Button variant="outlined" component="span">
                                Browse Files
                            </Button>
                        </Box>
                    </label>
                )}
            </Box>

            {/* Actions */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                    variant="contained" 
                    size="large"
                    disabled={!uploadedFile}
                    onClick={handleSubmit}
                    sx={{ px: 4, borderRadius: 8 }}
                >
                    Submit Assignment
                </Button>
            </Box>
        </Paper>
    );
};

export default AssignmentRenderer;
