import React, { useState } from 'react';
import { Box, TextField, Typography, MenuItem } from '@mui/material';

const AssignmentBlockSelector = ({ data, onChange }) => {
    // In a real app, you'd fetch the list of available assignments from the API
    const [assignmentId, setAssignmentId] = useState(data.assignment_id || '');

    const handleChange = (e) => {
        setAssignmentId(e.target.value);
        onChange({ ...data, assignment_id: e.target.value });
    };

    return (
        <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>Assignment Selection</Typography>
            <TextField
                select
                fullWidth
                label="Select Assignment"
                value={assignmentId}
                onChange={handleChange}
                helperText="Select an assignment to embed"
                size="small"
            >
                <MenuItem value=""><em>None</em></MenuItem>
                <MenuItem value="1">Course Project (Mock)</MenuItem>
                <MenuItem value="2">Final Paper (Mock)</MenuItem>
                {/* Dynamically populate this list */}
            </TextField>
        </Box>
    );
};

export default AssignmentBlockSelector;
