import { Paper, Typography } from '@mui/material';
import DOMPurify from 'dompurify';
import {
    RICH_TEXT_IMAGE_DATA_ATTRIBUTE_NAMES,
    RICH_TEXT_IMAGE_FIGURE_ATTRIBUTE,
    renderRichTextImageCaptions,
    richTextImageFigureSx,
    richTextImageSx,
} from '@/utils/richTextImages';

const TextRenderer = ({ content }) => {
    // If content is just a string, treat it as HTML
    // If it's an object (from Draft.js/Editor.js), we might need parsing. 
    // Assuming HTML string for now based on previous patterns.
    const htmlContent = typeof content === 'string' ? content : (content?.html || '');

    const sanitizedContent = renderRichTextImageCaptions(
        DOMPurify.sanitize(htmlContent, {
            ADD_ATTR: RICH_TEXT_IMAGE_DATA_ATTRIBUTE_NAMES,
        }),
    );

    if (!sanitizedContent) {
        return (
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 2 }}>
                <Typography color="text.secondary">
                    No text content available for this lesson.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper 
            elevation={0} 
            sx={{ 
                p: { xs: 2, md: 5 }, 
                bgcolor: 'background.paper', 
                borderRadius: 2,
                minHeight: '60vh',
                typography: 'body1',
                '& img': { ...richTextImageSx, borderRadius: 2, my: 2 },
                [`& figure[${RICH_TEXT_IMAGE_FIGURE_ATTRIBUTE}]`]: {
                    ...richTextImageFigureSx,
                    my: 2,
                    '& > img': {
                        ...richTextImageFigureSx['& > img'],
                        borderRadius: 2,
                    },
                },
                '& h1, & h2, & h3': { fontWeight: 700, mt: 3, mb: 2 },
                '& p': { mb: 2, lineHeight: 1.7 },
                '& ul, & ol': { mb: 2, pl: 3 },
                '& li': { mb: 1 },
                '& blockquote': { 
                    borderLeft: '4px solid', 
                    borderColor: 'primary.main', 
                    pl: 2, 
                    py: 1, 
                    my: 3, 
                    bgcolor: 'grey.50',
                    fontStyle: 'italic'
                }
            }}
        >
            <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
        </Paper>
    );
};

export default TextRenderer;
