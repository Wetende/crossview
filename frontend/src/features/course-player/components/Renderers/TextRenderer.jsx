import { PLAYER_RADII } from "../../playerRadii";
import { useMemo } from 'react';
import { Paper, Typography } from '@mui/material';
import {
    RICH_TEXT_IMAGE_FIGURE_ATTRIBUTE,
    richTextImageFigureSx,
    richTextImageSx,
} from '@/utils/richTextImages';
import { richTextContentSx } from '@/components/rich-text/richTextEditorConfig';
import { lessonRichTextSx } from './lessonRichTextSx';
import {
    sanitizeRichTextHtml,
    useRichTextMath,
} from '@/components/rich-text/richTextMath';

const TextRenderer = ({ content }) => {
    // If content is just a string, treat it as HTML
    // If it's an object (from Draft.js/Editor.js), we might need parsing.
    // Assuming HTML string for now based on previous patterns.
    const htmlContent = typeof content === 'string' ? content : (content?.html || '');

    const sanitizedContent = useMemo(
        () => sanitizeRichTextHtml(htmlContent),
        [htmlContent],
    );
    const renderedContent = useRichTextMath(sanitizedContent);

    if (!sanitizedContent) {
        return (
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper', borderRadius: PLAYER_RADII.surface }}>
                <Typography color="textSecondary">
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
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: PLAYER_RADII.surface,
                minHeight: '60vh',
                typography: 'body1',
                ...richTextContentSx,
                ...lessonRichTextSx,
                '& img': { ...richTextImageSx, borderRadius: PLAYER_RADII.surface, my: 2 },
                [`& figure[${RICH_TEXT_IMAGE_FIGURE_ATTRIBUTE}]`]: {
                    ...richTextImageFigureSx,
                    my: 2,
                    '& > img': {
                        ...richTextImageFigureSx['& > img'],
                        borderRadius: PLAYER_RADII.surface,
                    },
                },
            }}
        >
            <div dangerouslySetInnerHTML={{ __html: renderedContent }} />
        </Paper>
    );
};

export default TextRenderer;
