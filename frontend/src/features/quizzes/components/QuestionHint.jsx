import { useId, useState } from "react";
import { Box, Button, Collapse } from "@mui/material";
import { LightbulbOutlined } from "@mui/icons-material";

import RichTextContent from "@/components/rich-text/RichTextContent";
import { hasRichTextContent } from "@/components/rich-text/richTextMath";

/** Learner-controlled disclosure for a question hint. Nothing is recorded. */
export default function QuestionHint({ hint, sx }) {
    const [open, setOpen] = useState(false);
    const panelId = useId();

    if (!hasRichTextContent(hint)) return null;

    return (
        <Box sx={[{ mb: 3 }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}>
            <Button
                size="small"
                variant="text"
                startIcon={<LightbulbOutlined />}
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                onClick={() => setOpen((current) => !current)}
            >
                {open ? "Hide hint" : "Show hint"}
            </Button>
            <Collapse in={open} unmountOnExit>
                <Box
                    id={panelId}
                    role="region"
                    aria-label="Hint"
                    sx={{
                        mt: 1,
                        px: 2,
                        py: 1.5,
                        borderRadius: 1,
                        border: 1,
                        borderColor: "divider",
                        bgcolor: "action.hover",
                    }}
                >
                    <RichTextContent
                        html={hint}
                        sx={{ fontSize: "0.9375rem", lineHeight: 1.6 }}
                    />
                </Box>
            </Collapse>
        </Box>
    );
}
