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
    FormControl
} from '@mui/material';
import { Assignment as AssignmentIcon, Save as SaveIcon } from '@mui/icons-material';

export default function AssignmentEditor({ node, onSave }) {
    const [title, setTitle] = useState(node.title);
    const [instructions, setInstructions] = useState(node.properties?.instructions || '');
    const [points, setPoints] = useState(node.properties?.points || 100);
    const [submissionType, setSubmissionType] = useState(node.properties?.submission_type || 'file_upload');
    const [allowLate, setAllowLate] = useState(node.properties?.allow_late || false);

    const handleSave = () => {
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
                    placeholder="Assignment Title" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    fullWidth
                    InputProps={{ sx: { fontSize: '1.2rem', fontWeight: 500 } }}
                />
                <Button variant="contained" onClick={handleSave} size="medium" sx={{ ml: 2 }} startIcon={<SaveIcon />}>Save</Button>
            </Box>

            <Stack spacing={3}>
                <Box>
                    <Typography variant="subtitle2" gutterBottom>Instructions</Typography>
                    <TextField
                        multiline
                        rows={6}
                        fullWidth
                        placeholder="Enter assignment instructions..."
                        value={instructions}
                        onChange={e => setInstructions(e.target.value)}
                    />
                </Box>

                <Stack direction="row" spacing={2}>
                    <TextField 
                        label="Total Points"
                        type="number"
                        value={points}
                        onChange={e => setPoints(e.target.value)}
                        size="small"
                        sx={{ width: 150 }}
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
        </Box>
    );
}
