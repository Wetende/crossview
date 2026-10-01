import { useMemo } from "react";
import { Box } from "@mui/material";

import {
    RICH_TEXT_IMAGE_FIGURE_ATTRIBUTE,
    richTextImageFigureSx,
    richTextImageSx,
} from "@/utils/richTextImages";
import { richTextContentSx } from "./richTextEditorConfig";
import { sanitizeRichTextHtml, useRichTextMath } from "./richTextMath";

const richTextDisplaySx = {
    ...richTextContentSx,
    "& > :first-child": { mt: 0 },
    "& > :last-child": { mb: 0 },
    "& img": { ...richTextImageSx, my: 1.5 },
    [`& figure[${RICH_TEXT_IMAGE_FIGURE_ATTRIBUTE}]`]: {
        ...richTextImageFigureSx,
        my: 1.5,
    },
};

/**
 * Display authored rich text: DOMPurify sanitisation, image captions and
 * KaTeX maths (loaded only when the content has maths).
 */
export default function RichTextContent({ html, sx, ...props }) {
    const sanitized = useMemo(() => sanitizeRichTextHtml(html), [html]);
    const rendered = useRichTextMath(sanitized);

    if (!sanitized.trim()) return null;

    return (
        <Box
            {...props}
            sx={[
                richTextDisplaySx,
                ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
            ]}
            dangerouslySetInnerHTML={{ __html: rendered }}
        />
    );
}
