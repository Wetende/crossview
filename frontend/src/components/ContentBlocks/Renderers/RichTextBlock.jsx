import { Box } from '@mui/material';
import DOMPurify from 'dompurify';
import { richTextImageSx } from '@/utils/richTextImages';

const RichTextBlock = ({ data }) => {
    if (!data || !data.html) return null;

    const sanitizedHtml = DOMPurify.sanitize(data.html);

    return (
        <Box 
            sx={{ mb: 3, typography: 'body1', '& img': { ...richTextImageSx, my: 2 } }}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
};

export default RichTextBlock;
