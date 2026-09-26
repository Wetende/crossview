import RichTextContent from '@/components/rich-text/RichTextContent';
import {
    RICH_TEXT_IMAGE_FIGURE_ATTRIBUTE,
    richTextImageFigureSx,
    richTextImageSx,
} from '@/utils/richTextImages';

const RichTextBlock = ({ data }) => {
    if (!data || !data.html) return null;

    return (
        <RichTextContent
            html={data.html}
            sx={{
                mb: 3,
                '& img': { ...richTextImageSx, my: 2 },
                [`& figure[${RICH_TEXT_IMAGE_FIGURE_ATTRIBUTE}]`]: {
                    ...richTextImageFigureSx,
                    my: 2,
                },
            }}
        />
    );
};

export default RichTextBlock;
