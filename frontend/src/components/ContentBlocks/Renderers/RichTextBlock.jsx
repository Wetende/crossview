import { Box } from '@mui/material';
import DOMPurify from 'dompurify';
import {
    RICH_TEXT_IMAGE_DATA_ATTRIBUTE_NAMES,
    RICH_TEXT_IMAGE_FIGURE_ATTRIBUTE,
    renderRichTextImageCaptions,
    richTextImageFigureSx,
    richTextImageSx,
} from '@/utils/richTextImages';

const RichTextBlock = ({ data }) => {
    if (!data || !data.html) return null;

    const sanitizedHtml = renderRichTextImageCaptions(
        DOMPurify.sanitize(data.html, {
            ADD_ATTR: RICH_TEXT_IMAGE_DATA_ATTRIBUTE_NAMES,
        }),
    );

    return (
        <Box 
            sx={{
                mb: 3,
                typography: 'body1',
                '& img': { ...richTextImageSx, my: 2 },
                [`& figure[${RICH_TEXT_IMAGE_FIGURE_ATTRIBUTE}]`]: {
                    ...richTextImageFigureSx,
                    my: 2,
                },
            }}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
};

export default RichTextBlock;
