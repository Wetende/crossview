import React, { useState } from 'react';
import { Box, TextField, Typography, MenuItem } from '@mui/material';

const QuizBlockSelector = ({ data, onChange }) => {
    // In a real app, you'd fetch the list of available quizzes from the API
    const [quizId, setQuizId] = useState(data.quiz_id || '');

    const handleChange = (e) => {
        setQuizId(e.target.value);
        onChange({ ...data, quiz_id: e.target.value });
    };

    return (
        <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>Quiz Selection</Typography>
            <TextField
                select
                fullWidth
                label="Select Quiz"
                value={quizId}
                onChange={handleChange}
                helperText="Select a quiz to embed in this lesson"
                size="small"
            >
                <MenuItem value=""><em>None</em></MenuItem>
                <MenuItem value="1">Intro Quiz (Mock)</MenuItem>
                <MenuItem value="2">Final Exam (Mock)</MenuItem>
                {/* Dynamically populate this list */}
            </TextField>
        </Box>
    );
};

export default QuizBlockSelector;
