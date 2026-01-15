import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    Stack,
    FormControlLabel,
    Switch,
    InputLabel,
    Select,
    MenuItem,
    FormControl,
    Snackbar,
    Alert,
    FormHelperText
} from '@mui/material';
import { Assignment as AssignmentIcon, Save as SaveIcon } from '@mui/icons-material';

export default function AssignmentEditor({ node, onSave }) {
    const [title, setTitle] = useState(node.title);
    const [instructions, setInstructions] = useState(node.properties?.instructions || '');
    const [points, setPoints] = useState(node.properties?.points || 100);
    const [submissionType, setSubmissionType] = useState(node.properties?.submission_type || 'file_upload');
    const [allowLate, setAllowLate] = useState(node.properties?.allow_late || false);

    // Validation state
    const [errors, setErrors] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    
    // Touched state - track which fields have been interacted with
    const [touched, setTouched] = useState({});
    
    // Detect if this is a new node (not yet saved to database)
    const isNew = !node.id || node.id.toString().startsWith('temp_') || node.title === 'Untitled Assignment';
    
    // Mark a field as touched
    const handleBlur = (fieldName) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
    };
    
    // Mark all fields as touched (used on submit attempt)
    const touchAllFields = () => {
        setTouched({ title: true, instructions: true, points: true });
    };
    
    // Get error for a field (only if touched)
    const getFieldError = (fieldName) => {
        return touched[fieldName] ? errors[fieldName] : undefined;
    };

    const validate = () => {
        const newErrors = {};
        
        if (!title || title.trim().length < 5) {
            newErrors.title = 'Title must be at least 5 characters';
        } else if (title.length > 100) {
            newErrors.title = 'Title must be 100 characters or less';
        }
        
        if (!instructions || instructions.length < 100) {
            newErrors.instructions = `Instructions must be at least 100 characters (${instructions.length}/100)`;
        }
        
        if (!points || points <= 0) {
            newErrors.points = 'Points must be greater than 0';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isFormValid = () => {
        if (!title || title.trim().length < 5 || title.length > 100) return false;
        if (!instructions || instructions.length < 100) return false;
        if (!points || points <= 0) return false;
        return true;
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleSave = () => {
        touchAllFields();
        if (!validate()) {
            setSnackbar({ open: true, message: 'Please fix the validation errors', severity: 'error' });
            return;
        }
        
        onSave(node.id, {
            title,
            properties: {
                ...node.properties,
                instructions,
                points,
                submission_type: submissionType,
                allow_late: allowLate
            }
        });
        
        setSnackbar({ open: true, message: 'Assignment saved successfully!', severity: 'success' });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                    <AssignmentIcon />
                    <Typography variant="body2" sx={{ ml: 1 }}>Assignment</Typography>
                </Box>
                <TextField 
                    variant="standard" 
                    placeholder="Assignment Title *" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    onBlur={() => handleBlur('title')}
                    fullWidth
                    error={!!getFieldError('title')}
                    helperText={getFieldError('title') || `${title.length}/100 characters`}
                    InputProps={{ sx: { fontSize: '1.2rem', fontWeight: 500 } }}
                />
                <Button variant="contained" onClick={handleSave} size="medium" sx={{ ml: 2 }} startIcon={<SaveIcon />} disabled={!isFormValid()}>
                    {isNew ? 'Create' : 'Save'}
                </Button>
            </Box>

            <Stack spacing={3}>
                <Box onBlur={() => handleBlur('instructions')}>
                    <Typography variant="subtitle2" gutterBottom color={getFieldError('instructions') ? 'error' : 'inherit'}>
                        Instructions *
                    </Typography>
                    <TextField
                        multiline
                        rows={6}
                        fullWidth
                        placeholder="Enter assignment instructions (min 100 characters)..."
                        value={instructions}
                        onChange={e => setInstructions(e.target.value)}
                        error={!!getFieldError('instructions')}
                    />
                    {getFieldError('instructions') && (
                        <FormHelperText error>{getFieldError('instructions')}</FormHelperText>
                    )}
                    <Typography variant="caption" color="text.secondary">
                        {instructions.length}/100 minimum characters
                    </Typography>
                </Box>

                <Stack direction="row" spacing={2}>
                    <TextField 
                        label="Total Points *"
                        type="number"
                        value={points}
                        onChange={e => setPoints(e.target.value)}
                        onBlur={() => handleBlur('points')}
                        size="small"
                        sx={{ width: 150 }}
                        error={!!getFieldError('points')}
                        helperText={getFieldError('points')}
                        required
                    />
                    <FormControl size="small" sx={{ width: 200 }}>
                        <InputLabel>Submission Type</InputLabel>
                        <Select value={submissionType} label="Submission Type" onChange={e => setSubmissionType(e.target.value)}>
                            <MenuItem value="file_upload">File Upload</MenuItem>
                            <MenuItem value="text_entry">Text Entry</MenuItem>
                            <MenuItem value="external_link">External Link/URL</MenuItem>
                            <MenuItem value="media_recording">Media Recording</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>

                <FormControlLabel
                    control={<Switch checked={allowLate} onChange={e => setAllowLate(e.target.checked)} />}
                    label="Allow Late Submissions"
                />
            </Stack>
            
            {/* Success/Error Snackbar */}
            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={4000} 
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
