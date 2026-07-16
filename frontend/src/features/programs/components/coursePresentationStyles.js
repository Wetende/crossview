export const tabsBarSx = {
    maxWidth: "100%",
    overflow: "hidden",
    borderBottom: 1,
    borderColor: "divider",
};

export const tabsSx = {
    minHeight: 48,
    "& .MuiTabs-flexContainer": {
        gap: { xs: 0.5, sm: 1 },
    },
    "& .MuiTab-root": {
        minWidth: "auto",
        minHeight: 48,
        px: { xs: 1.5, sm: 2.25 },
        textTransform: "none",
        fontWeight: 600,
        whiteSpace: "nowrap",
        "&.Mui-focusVisible": {
            outline: "3px solid",
            outlineColor: "primary.light",
            outlineOffset: -3,
        },
    },
};

export const tabPanelSx = {
    py: 3,
    minWidth: 0,
};

export const richTextSx = {
    mb: 4,
    "& p": { mb: 1 },
    "& ul, & ol": { pl: 3, mb: 1.5 },
    "& li": { mb: 0.5 },
};

export const learningOutcomesSx = {
    "& ul, & ol": { pl: 3, mb: 2 },
    "& li": { mb: 0.75 },
    "& h1, & h2, & h3": { mb: 1.5, mt: 2 },
    "& p": { mb: 1 },
};

export const curriculumAccordionSx = {
    m: "0 !important",
    bgcolor: "transparent",
    boxShadow: "none",
    borderRadius: "0 !important",
    "&::before": { display: "none" },
};

export const curriculumSummarySx = {
    minHeight: 52,
    px: 0,
    "&.Mui-expanded": { minHeight: 52 },
    "& .MuiAccordionSummary-content": {
        my: 1,
        minWidth: 0,
    },
    "& .MuiAccordionSummary-content.Mui-expanded": { my: 1 },
    "& .MuiAccordionSummary-expandIconWrapper": {
        width: 28,
        height: 28,
        borderRadius: "50%",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "grey.200",
        color: "text.secondary",
    },
    "&.Mui-focusVisible": {
        bgcolor: "transparent",
        outline: "3px solid",
        outlineColor: "primary.light",
        outlineOffset: 2,
    },
};

export const lessonListSx = {
    overflow: "hidden",
    borderRadius: 1.5,
    bgcolor: "grey.100",
};

export const lessonRowSx = {
    minHeight: 56,
    px: { xs: 1.5, sm: 2.25 },
    py: 1.25,
    gap: 1,
    alignItems: "center",
    borderBottom: "2px solid",
    borderColor: "background.paper",
    "&:last-of-type": { borderBottom: 0 },
};

export const greyAccordionSx = {
    m: "0 !important",
    bgcolor: "transparent",
    boxShadow: "none",
    borderRadius: "8px !important",
    overflow: "hidden",
    "&::before": { display: "none" },
};

export const greySummarySx = {
    minHeight: 56,
    px: { xs: 1.75, sm: 2.25 },
    bgcolor: "grey.100",
    "&.Mui-expanded": { minHeight: 56 },
    "& .MuiAccordionSummary-content": {
        my: 1.25,
        minWidth: 0,
    },
    "& .MuiAccordionSummary-content.Mui-expanded": { my: 1.25 },
    "& .MuiAccordionSummary-expandIconWrapper": {
        width: 28,
        height: 28,
        borderRadius: "50%",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.paper",
        color: "text.secondary",
    },
    "&.Mui-focusVisible": {
        bgcolor: "grey.100",
        outline: "3px solid",
        outlineColor: "primary.light",
        outlineOffset: -3,
    },
};

export const greyDetailsSx = {
    px: { xs: 1.75, sm: 2.25 },
    py: 2,
    bgcolor: "background.paper",
    border: 1,
    borderTop: 0,
    borderColor: "divider",
    color: "text.secondary",
    "& p:last-child": { mb: 0 },
};
