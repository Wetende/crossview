import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const RichTextBlockEditor = ({ data, onChange }) => {
    const [html, setHtml] = useState(data.html || '');

    useEffect(() => {
        const timer = setTimeout(() => {
             onChange({ ...data, html });
        }, 500); // 500ms debounce
        return () => clearTimeout(timer);
    }, [html]);

    return (
        <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>Content</Typography>
            <ReactQuill 
                theme="snow"
                value={html}
                onChange={setHtml}
                style={{ height: 200, marginBottom: 50 }} 
            />
        </Box>
    );
};

export default RichTextBlockEditor;
