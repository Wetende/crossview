import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Box, Typography, Button, Paper, Chip, Divider } from '@mui/material';
import { CloudUpload as UploadIcon, InsertDriveFile as FileIcon, CheckCircle as CheckIcon, AccessTime as TimeIcon } from '@mui/icons-material';

const AssignmentRenderer = ({ node, enrollmentId, onSubmit }) => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get assignment details from node properties
    const assignment = {
        title: node?.title || 'Assignment',
        description: node?.description || node?.properties?.description || '',
        dueDate: node?.properties?.due_date,
        maxFileSize: node?.properties?.max_file_size || 10, // MB
        acceptedTypes: node?.properties?.accepted_types || '.pdf,.doc,.docx,.zip'
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setUploadedFile(file);
        }
    };

    const handleSubmit = () => {
        if (!uploadedFile || isSubmitting) return;
        
        setIsSubmitting(true);
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('mark_complete', 'true');
        
        if (node?.id && enrollmentId) {
            router.post(`/student/programs/${enrollmentId}/session/${node.id}/`, formData, {
                preserveScroll: true,
                only: ['isCompleted', 'curriculum'],
                onSuccess: () => {
                    setIsSubmitted(true);
                    if (onSubmit) onSubmit({ file: uploadedFile });
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            });
        } else {
            // Fallback for mock/demo
            setIsSubmitted(true);
            setIsSubmitting(false);
            if (onSubmit) onSubmit({ file: uploadedFile });
        }
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
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Button 
                        variant="contained" 
                        href={`/student/assignment/${node?.id}/`}
                        sx={{ minWidth: 180 }}
                    >
                        View Submission Details
                    </Button>
                    <Button variant="outlined" onClick={() => setIsSubmitted(false)}>
                        Submit Another
                    </Button>
                </Box>
            </Paper>
        );
    }

    return (
        <Paper elevation={0} sx={{ p: { xs: 2, md: 5 }, borderRadius: 2, bgcolor: 'background.paper' }}>
            {/* Header Details */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Chip label="Assignment" size="small" color="primary" variant="outlined" />
                    {assignment.dueDate && (
                        <Chip 
                            icon={<TimeIcon />} 
                            label={`Due: ${new Date(assignment.dueDate).toLocaleDateString()}`} 
                            size="small" 
                            variant="outlined" 
                        />
                    )}
                </Box>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    {assignment.title}
                </Typography>
                {assignment.description && (
                    <Typography variant="body1" color="text.secondary">
                        {assignment.description}
                    </Typography>
                )}
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
                    accept={assignment.acceptedTypes}
                    style={{ display: 'none' }}
                    id="assignment-file-upload"
                    type="file"
                    onChange={handleFileChange}
                />
                
                {uploadedFile ? (
                    <Box sx={{ mb: 2 }}>
                        <FileIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
                        <Typography variant="h6">{uploadedFile.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                        <Button color="error" size="small" onClick={() => setUploadedFile(null)} sx={{ mt: 1 }}>
                            Remove
                        </Button>
                    </Box>
                ) : (
                    <label htmlFor="assignment-file-upload">
                        <Box sx={{ cursor: 'pointer' }}>
                            <UploadIcon color="action" sx={{ fontSize: 48, mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                Drag and drop your file here
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                or click to browse (max {assignment.maxFileSize}MB)
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
                    disabled={!uploadedFile || isSubmitting}
                    onClick={handleSubmit}
                    sx={{ px: 4, borderRadius: 8 }}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                </Button>
            </Box>
        </Paper>
    );
};

export default AssignmentRenderer;
