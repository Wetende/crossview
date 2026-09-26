// Shared reading scale for lesson rich text (TextRenderer, including the
// RICHTEXT content block, which renders through TextRenderer).
export const lessonRichTextSx = {
    fontSize: "1.0625rem",
    lineHeight: 1.75,
    "& h1, & h2, & h3, & h4": {
        fontWeight: 700,
        lineHeight: 1.3,
        mt: 3,
        mb: 1.5,
    },
    "& h1": { fontSize: "1.75rem" },
    "& h2": { fontSize: "1.5rem" },
    "& h3": { fontSize: "1.25rem" },
    "& h4": { fontSize: "1.125rem" },
    "& p": { mb: 2, lineHeight: "inherit" },
    "& ul, & ol": { mb: 2, pl: 3 },
    "& li": { mb: 1 },
    "& blockquote": {
        borderLeft: "4px solid",
        borderColor: "primary.main",
        pl: 2,
        py: 1,
        my: 3,
        bgcolor: "grey.50",
        fontStyle: "italic",
    },
};
