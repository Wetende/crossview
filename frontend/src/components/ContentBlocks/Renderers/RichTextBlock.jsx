import React from 'react';
import { Box } from '@mui/material';
import DOMPurify from 'dompurify';

const RichTextBlock = ({ data }) => {
    if (!data || !data.html) return null;

    const sanitizedHtml = DOMPurify.sanitize(data.html);

    return (
        <Box 
            sx={{ mb: 3, typography: 'body1' }}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
};

export default RichTextBlock;
