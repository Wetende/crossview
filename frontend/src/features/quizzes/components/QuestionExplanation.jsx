import { Box, Typography } from "@mui/material";

import RichTextContent from "@/components/rich-text/RichTextContent";
import { hasRichTextContent } from "@/components/rich-text/richTextMath";

/** Rich-text question explanation shown in answer review. */
export default function QuestionExplanation({
    explanation,
    label = "Explanation",
    ariaLabel,
    sx,
}) {
    if (!hasRichTextContent(explanation)) return null;

    return (
        <Box
            role="region"
            aria-label={ariaLabel || label}
            sx={[
                {
                    mt: 1.5,
                    px: 2,
                    py: 1.5,
                    borderRadius: 1,
                    borderLeft: 3,
                    borderColor: "info.main",
                    bgcolor: "action.hover",
                },
                ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
            ]}
        >
            <Typography
                variant="caption"
                color="textSecondary"
                component="p"
                sx={{ fontWeight: 700, mb: 0.5 }}
            >
                {label}
            </Typography>
            <RichTextContent
                html={explanation}
                sx={{ fontSize: "0.875rem", lineHeight: 1.6 }}
            />
        </Box>
    );
}
