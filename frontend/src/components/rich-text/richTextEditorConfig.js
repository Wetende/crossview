export const LMS_RICH_TEXT_FONT_FAMILY =
    '"Albert Sans", "Helvetica Neue", Arial, sans-serif';

export const RICH_TEXT_FONT_OPTIONS = [
    {
        label: "Default — Albert Sans",
        shortLabel: "Albert Sans",
        value: "",
        family: LMS_RICH_TEXT_FONT_FAMILY,
    },
    {
        label: "Verdana",
        shortLabel: "Verdana",
        value: "Verdana, Geneva, sans-serif",
        family: "Verdana, Geneva, sans-serif",
    },
    {
        label: "Arial / Helvetica",
        shortLabel: "Arial",
        value: "Arial, Helvetica, sans-serif",
        family: "Arial, Helvetica, sans-serif",
    },
    {
        label: "Georgia",
        shortLabel: "Georgia",
        value: "Georgia, 'Times New Roman', serif",
        family: "Georgia, 'Times New Roman', serif",
    },
    {
        label: "Courier New",
        shortLabel: "Courier",
        value: "'Courier New', Courier, monospace",
        family: "'Courier New', Courier, monospace",
    },
];

export const RICH_TEXT_FONT_SIZES = [12, 14, 16, 18, 20, 24, 32];
export const DEFAULT_RICH_TEXT_FONT_SIZE = 16;
export const RICH_TEXT_LINE_HEIGHTS = [
    { label: "Compact", value: "1.5" },
    { label: "Default", value: "1.75" },
    { label: "Spacious", value: "2" },
];

export const RICH_TEXT_COLORS = [
    { label: "Slate", value: "#334155" },
    { label: "Red", value: "#b91c1c" },
    { label: "Orange", value: "#c2410c" },
    { label: "Amber", value: "#a16207" },
    { label: "Green", value: "#15803d" },
    { label: "Teal", value: "#0f766e" },
    { label: "Blue", value: "#1d4ed8" },
    { label: "Purple", value: "#7e22ce" },
];

export const RICH_TEXT_BACKGROUND_COLORS = [
    { label: "Soft red", value: "#fee2e2" },
    { label: "Soft orange", value: "#ffedd5" },
    { label: "Soft yellow", value: "#fef9c3" },
    { label: "Soft green", value: "#dcfce7" },
    { label: "Soft teal", value: "#ccfbf1" },
    { label: "Soft blue", value: "#dbeafe" },
    { label: "Soft purple", value: "#f3e8ff" },
    { label: "Soft grey", value: "#e2e8f0" },
];

export const EMPTY_LINK_VALUE = {
    href: "",
    text: "",
    title: "",
    target: "",
    isExisting: false,
};

export const EMPTY_IMAGE_VALUE = {
    source: "",
    alt: "",
    decorative: false,
    title: "",
    caption: "",
    width: "",
    height: "",
    lockAspectRatio: true,
};

export const getActiveFontSize = (editor) => {
    const value = editor?.getAttributes("textStyle")?.fontSize;
    const parsed = Number.parseInt(value, 10);
    return RICH_TEXT_FONT_SIZES.includes(parsed)
        ? parsed
        : DEFAULT_RICH_TEXT_FONT_SIZE;
};

export const getAdjacentFontSize = (currentSize, direction) => {
    const currentIndex = RICH_TEXT_FONT_SIZES.indexOf(currentSize);
    const safeIndex =
        currentIndex === -1
            ? RICH_TEXT_FONT_SIZES.indexOf(DEFAULT_RICH_TEXT_FONT_SIZE)
            : currentIndex;
    const nextIndex = Math.min(
        RICH_TEXT_FONT_SIZES.length - 1,
        Math.max(0, safeIndex + direction),
    );
    return RICH_TEXT_FONT_SIZES[nextIndex];
};

export const normalizeLinkUrl = (value) => {
    const trimmed = String(value || "").trim();
    if (!trimmed) {
        return "";
    }

    if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) {
        return trimmed;
    }

    if (/^[a-z][a-z\d+.-]*:/i.test(trimmed)) {
        return null;
    }

    return `https://${trimmed}`;
};

export const normalizeImageSource = (value) => {
    const trimmed = String(value || "").trim();
    if (
        /^(https?:\/\/|\/(?!\/)|data:image\/(?:png|jpe?g|gif|webp|svg\+xml);base64,)/i.test(
            trimmed,
        )
    ) {
        return trimmed;
    }
    return null;
};

export const richTextContentSx = {
    fontFamily: LMS_RICH_TEXT_FONT_FAMILY,
    fontSize: "1rem",
    lineHeight: 1.75,
    overflowWrap: "anywhere",
    "& p": { lineHeight: "inherit" },
    "& a": { overflowWrap: "anywhere" },
};
